import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const { DISCORD_TOKEN, DISCORD_APPLICATION_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  console.error('Error: DISCORD_TOKEN and DISCORD_APPLICATION_ID must be set in .env or environment variables');
  process.exit(1);
}

const commands = [
  {
    name: 'join',
    description: 'Claim your community welcome bonus (LTZ tokens)',
  },
  {
    name: 'daily',
    description: 'Claim your daily participation reward',
  },
  {
    name: 'daily-config',
    description: 'Admin: Configure which event ID is triggered by /daily',
    options: [
      {
        name: 'event_id',
        description: 'The Event ID to bind to /daily (e.g. custom_...)',
        type: ApplicationCommandOptionType.String,
        required: true,
      }
    ]
  },
  {
    name: 'balance',
    description: 'Check your Loyalteez token balance',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
  {
    name: 'claim',
    description: 'Claim a reward for a specific event (e.g. newsletter_subscribe)',
    options: [
      {
        name: 'event_id',
        description: 'The ID of the event to claim',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: 'drop',
    description: 'Admin: Create a reward drop button for the community',
    options: [
      {
        name: 'event_id',
        description: 'The ID of the event users will claim',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'label',
        description: 'Text to display on the button (default: "Claim Reward")',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: 'description',
        description: 'Message content for the drop',
        type: ApplicationCommandOptionType.String,
        required: false,
      }
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(DISCORD_APPLICATION_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
