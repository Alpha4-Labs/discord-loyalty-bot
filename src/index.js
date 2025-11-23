import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
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

      // 4. Handle Application Commands
      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        return await handleCommand(interaction, env);
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
  const { name } = interaction.data;
  const userId = interaction.member.user.id;
  const username = interaction.member.user.username;
  const userEmail = `discord_${userId}@loyalteez.app`; // Deterministic email mapping

  const loyalteez = new LoyalteezClient(env.BRAND_ID, env.LOYALTEEZ_API_URL);

  try {
    switch (name) {
      case 'join':
        // Trigger 'discord_join' event
        // Note: In a real app, you might check if they actually joined recently or use a Gateway bot.
        // Here we simulate the reward trigger manually.
        const joinResult = await loyalteez.sendEvent('discord_join', userEmail, {
          discord_id: userId,
          username: username,
          server_id: interaction.guild_id
        });

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `🎉 Welcome to the community, <@${userId}>! You've earned **${joinResult.rewardAmount || 'some'} LTZ** tokens! 🪙\nCheck your balance at [marketplace.loyalteez.xyz](https://marketplace.loyalteez.xyz)`
          }
        });

      case 'daily':
        // Trigger 'daily_checkin' event
        const dailyResult = await loyalteez.sendEvent('daily_checkin', userEmail, {
          discord_id: userId,
          username: username
        });

        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `✅ Daily check-in complete! You earned **${dailyResult.rewardAmount} LTZ**.`
          }
        });

      case 'balance':
        // We don't have a balance endpoint in the API yet, so we link to the marketplace
        return jsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `💰 To check your LTZ balance and redeem rewards, visit the [Loyalteez Marketplace](https://marketplace.loyalteez.xyz).`
          }
        });
        
      case 'help':
        return jsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: `**Loyalteez Bot Commands**\n` +
                         `/join - Claim your welcome bonus\n` +
                         `/daily - Claim your daily check-in reward\n` + 
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
    
    // Handle specific API errors (like cooldowns)
    let errorMessage = 'Failed to process reward. Please try again later.';
    
    if (error.message && error.message.includes('Duplicate reward')) {
        errorMessage = `⏳ You've already claimed this reward recently! Please wait for the cooldown to expire.`;
    }

    return jsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ ${errorMessage}`
      }
    });
  }
}

/**
 * Helper to send JSON response
 */
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

