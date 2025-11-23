import { InteractionType, InteractionResponseType, verifyKey, MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';
import { LoyalteezClient } from './utils/loyalteez.js';

export default {
  /**
   * Main Worker Handler
   */
  async fetch(request, env, ctx) {
    // 1. Verify Discord Signature
    if (request.method === 'POST') {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');
      const body = await request.text();

      if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
        return new Response('Missing signature or public key', { status: 401 });
      }

      const isValidRequest = verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
      if (!isValidRequest) {
        return new Response('Bad request signature', { status: 401 });
      }

      // 2. Parse Interaction
      const interaction = JSON.parse(body);

      // 3. Handle PING (Required by Discord)
      if (interaction.type === InteractionType.PING) {
        return new Response(JSON.stringify({
          type: InteractionResponseType.PONG,
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 4. Handle Application Commands (Slash Commands)
      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        return await handleCommand(interaction, env);
      }

      // 5. Handle Message Components (Buttons)
      if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        return await handleComponent(interaction, env, ctx);
      }

      return new Response('Unknown Type', { status: 400 });
    }

    // Health check for Worker
    return new Response('Loyalteez Discord Bot is running', { status: 200 });
  }
};

/**
 * Handle Slash Commands
 */
async function handleCommand(interaction, env) {
  const { name, options } = interaction.data;
  const userId = interaction.member.user.id;
  const username = interaction.member.user.username;
  const userEmail = `discord_${userId}@loyalteez.app`; // Deterministic email mapping

  // Use Service Bindings if available (avoids 522 timeouts), otherwise fallback to HTTP
  const loyalteez = new LoyalteezClient(env.BRAND_ID, env.LOYALTEEZ_API_URL, env.EVENT_HANDLER, env.PREGENERATION);

  try {
    switch (name) {
      case 'join':
        const joinResult = await loyalteez.sendEvent('discord_join', userEmail, {
          discord_id: userId,
          username: username,
          server_id: interaction.guild_id
        });

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `🎉 Welcome to the community, <@${userId}>! You've earned **${joinResult.rewardAmount || 'some'} LTZ** tokens! 🪙\nCheck your balance at [perks.loyalteez.app](https://perks.loyalteez.app)`
          }
        });

      case 'daily-config':
        // Admin command to bind /daily to a specific event ID
        const dailyEventId = options.find(opt => opt.name === 'event_id')?.value;
        if (!dailyEventId) {
            return jsonResponse({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: '❌ Please provide an event_id.' }
            });
        }
        
        await env.DISCORD_BOT_KV.put(`DAILY_EVENT_ID:${interaction.guild_id}`, dailyEventId);
        
        return jsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `✅ **Daily Reward Configured!**\nNow, when users type \`/daily\`, they will claim event: \`${dailyEventId}\`.` }
        });

      case 'daily':
        let targetEventId = 'daily_checkin'; // Default
        const configuredId = await env.DISCORD_BOT_KV.get(`DAILY_EVENT_ID:${interaction.guild_id}`);
        if (configuredId) {
            targetEventId = configuredId;
        }

        const dailyResult = await loyalteez.sendEvent(targetEventId, userEmail, {
          discord_id: userId,
          username: username,
          server_id: interaction.guild_id
        });

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✅ Daily check-in complete! You earned **${dailyResult.rewardAmount} LTZ**.`
          }
        });

      case 'claim':
        const eventIdOption = options && options.find(opt => opt.name === 'event_id');
        if (!eventIdOption || !eventIdOption.value) {
            return jsonResponse({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `❌ Please provide an event ID. Usage: /claim <event_id>` }
            });
        }
        const eventId = eventIdOption.value;

        const claimResult = await loyalteez.sendEvent(eventId, userEmail, {
          discord_id: userId,
          username: username,
          server_id: interaction.guild_id,
          source: 'discord_claim'
        });

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✅ Claim successful! You earned **${claimResult.rewardAmount} LTZ** for event: \`${eventId}\`.`
          }
        });

      case 'drop':
        // Check admin permission (simplification: user must have Manage Guild permission)
        // In a real app, check interaction.member.permissions bitfield
        const dropEventId = options.find(opt => opt.name === 'event_id')?.value;
        const label = options.find(opt => opt.name === 'label')?.value || 'Claim Reward';
        const description = options.find(opt => opt.name === 'description')?.value || `Click the button below to claim the **${dropEventId}** reward!`;

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: description,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.BUTTON,
                    style: ButtonStyleTypes.PRIMARY,
                    label: label,
                    custom_id: `claim:${dropEventId}`,
                  }
                ]
              }
            ]
          }
        });

      case 'balance':
        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `💰 To check your LTZ balance and redeem rewards, visit [perks.loyalteez.app](https://perks.loyalteez.app).`
          }
        });
        
      case 'help':
        return jsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `**Loyalteez Bot Commands**\n` +
                         `/join - Claim your welcome bonus\n` +
                         `/daily - Claim your daily check-in reward\n` + 
                         `/claim <event_id> - Claim a specific reward by Event ID\n` +
                         `/drop <event_id> - (Admin) Create a reward drop button\n` +
                         `/daily-config <event_id> - (Admin) Set the event for /daily\n` +
                         `/balance - Check your token balance`
            }
        });

      default:
        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Unknown command: ${name}` }
        });
    }
  } catch (error) {
    console.error('Command Error:', error);
    let errorMessage = 'Failed to process reward. Please try again later.';
    if (error.message && error.message.includes('Duplicate reward')) {
        errorMessage = `⏳ You've already claimed this reward recently! Please wait for the cooldown to expire.`;
    } else if (error.message && (error.message.includes('not found') || error.message.includes('No active rule'))) {
        errorMessage = `❓ Event not found or not active. Check the Event ID and try again.`;
    }
    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `❌ ${errorMessage}` }
    });
  }
}

/**
 * Handle Message Components (Buttons)
 */
async function handleComponent(interaction, env, ctx) {
  const customId = interaction.data.custom_id;

  if (customId.startsWith('claim:')) {
    // 1. Defer the response immediately to avoid timeouts during blockchain processing
    // We use flags: 64 for ephemeral (hidden) response
    ctx.waitUntil(processClaim(interaction, env));
    
    return jsonResponse({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64
      }
    });
  }
  
  return jsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: 'Unknown component interaction', flags: 64 }
  });
}

/**
 * Process claim in background and update response
 */
async function processClaim(interaction, env) {
  const customId = interaction.data.custom_id;
  const eventId = customId.split(':')[1];
  const userId = interaction.member.user.id;
  const username = interaction.member.user.username;
  const userEmail = `discord_${userId}@loyalteez.app`;
  const appId = env.DISCORD_APPLICATION_ID;
  const token = interaction.token;

  const loyalteez = new LoyalteezClient(env.BRAND_ID, env.LOYALTEEZ_API_URL, env.EVENT_HANDLER, env.PREGENERATION);

  try {
    const result = await loyalteez.sendEvent(eventId, userEmail, {
      discord_id: userId,
      username: username,
      server_id: interaction.guild_id,
      source: 'discord_button'
    });

    // Update the original deferred response with success
    await updateInteractionResponse(appId, token, {
      content: `✅ You claimed the **${eventId}** reward! (+${result.rewardAmount} LTZ)`
    });

  } catch (error) {
    console.error('Claim Error:', error);
    let errorMessage = 'Failed to process reward.';
    if (error.message && error.message.includes('Duplicate reward')) {
        errorMessage = `⏳ You've already claimed this!`;
    } else if (error.message && (error.message.includes('not found') || error.message.includes('No active rule'))) {
        errorMessage = `❓ Event invalid or inactive.`;
    }

    // Update with error
    await updateInteractionResponse(appId, token, {
      content: `❌ ${errorMessage}`
    });
  }
}

async function updateInteractionResponse(appId, token, body) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/**
 * Helper to send JSON response
 */
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
