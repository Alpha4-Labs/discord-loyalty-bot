# Discord Loyalty Bot (Cloudflare Workers)

A serverless Discord bot built on Cloudflare Workers that integrates with the Loyalteez API to reward community members with LTZ tokens.

## Features

- **Serverless Architecture**: Runs entirely on Cloudflare Workers (no paid VPS required).
- **Slash Commands**: `/join`, `/daily`, `/balance`.
- **Instant Rewards**: Calls Loyalteez API to mint tokens immediately upon interaction.
- **Secure**: Verifies Discord interaction signatures.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Cloudflare Account](https://dash.cloudflare.com/)
- [Discord Developer Account](https://discord.com/developers/applications)
- Loyalteez Brand ID (from Partner Portal)

## Setup Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a "New Application".
3. Copy the **Application ID** and **Public Key**.
4. Go to the **Bot** tab and create a bot user.
5. Copy the **Bot Token** (Reset Token if needed).

### 3. Configuration

Update `wrangler.toml` with your public details:

```toml
[vars]
DISCORD_APPLICATION_ID = "your_app_id"
DISCORD_PUBLIC_KEY = "your_public_key"
BRAND_ID = "your_loyalteez_brand_id"
```

Set your secrets (DO NOT commit these to git):

```bash
npx wrangler secret put DISCORD_TOKEN
# Paste your Bot Token when prompted
```

### 4. Deploy the Worker

```bash
npm run deploy
```

Copy the **Worker URL** (e.g., `https://discord-loyalty-bot.yourname.workers.dev`).

### 5. Connect to Discord

1. Go back to Discord Developer Portal -> **General Information**.
2. Paste your Worker URL into the **Interactions Endpoint URL** field.
   - *Note: Discord will send a PING request to verify the endpoint. If deployment was successful, this will pass.*

### 6. Register Slash Commands

Create a `.env` file for the registration script:

```bash
# .env
DISCORD_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=your_app_id_here
```

Run the registration script:

```bash
node scripts/register-commands.js
```

### 7. Invite the Bot

1. Go to Developer Portal -> **OAuth2** -> **URL Generator**.
2. Select scopes: `bot`, `applications.commands`.
3. Copy the generated URL and open it to invite the bot to your server.

## Project Structure

- `src/index.js`: Main worker logic (Router, Signature Verification).
- `src/utils/loyalteez.js`: API Client for Loyalteez.
- `scripts/register-commands.js`: Helper to register slash commands.

## Customization

To add new commands:
1. Add the command definition in `scripts/register-commands.js`.
2. Add the handler logic in `src/index.js` (inside `handleCommand` switch).
3. Run `node scripts/register-commands.js` to update Discord.
4. Redeploy with `npm run deploy`.

