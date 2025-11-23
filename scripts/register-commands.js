import { REST, Routes } from 'discord.js';
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
    name: 'balance',
    description: 'Check your Loyalteez token balance',
  },
  {
    name: 'help',
    description: 'Show available commands',
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
