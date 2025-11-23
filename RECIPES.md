# 🧪 Loyalteez Discord Integration Recipes

This guide provides "recipes" for integrating Loyalteez into your Discord community, ranging from simple one-click drops to complex, automated habit loops.

---

## Level 1: The "Instant Drop" (Basic)
**Best for:** AMAs, Live Events, Flash Giveaways, Polls.

The simplest way to reward users. You create a button, they click it, they get points.

### Steps
1.  **Create Event**: Go to **Partner Portal -> Settings -> Events**.
2.  **Configure**: Click **"Create Custom Event"**.
    *   Select **"Discord Bot Interaction"** as the detection method.
    *   Set your reward amount (e.g., 50 LTZ).
    *   **Save Configuration**.
3.  **Copy Command**: Expand your new event in the list. You will see a generated command like:
    ```
    /drop event_id:custom_123... label:"Claim AMA Reward"
    ```
4.  **Deploy**: Paste that command into your Discord channel.
5.  **Result**: A button appears. Users click it and receive 50 LTZ instantly.

---

## Level 2: The "Daily Habit" (Retention)
**Best for:** Daily check-ins, keeping users coming back.

You can create a recurring daily reward and bind it to the easy-to-remember `/daily` command.

### Steps
1.  **Create Event**: In Partner Portal, create a Custom Event named "Daily Reward".
    *   **Reward**: 10 LTZ.
    *   **Cooldown**: Set to **24 hours**.
    *   **Save Configuration**.
2.  **Get Event ID**: Expand the event and copy the long ID (e.g., `custom_x8s7...`).
3.  **Bind Command**: In your Discord server (as Admin), run:
    ```
    /daily-config event_id:custom_x8s7...
    ```
4.  **Result**: Now, whenever *anyone* types `/daily`, they will trigger this specific reward rule. If they try again within 24 hours, the bot will remind them to wait.

---

## Level 3: Role-Gated Rewards (Intermediate)
**Best for:** VIPs, OG members, Subscribers, or specific role holders.

The bot itself respects Discord's channel permissions. By placing a Drop in a restricted channel, you effectively gate the reward.

### Steps
1.  **Create Private Channel**: Create a channel (e.g., `#vip-lounge`) and set permissions so only the **"VIP"** role can view it.
2.  **Create Event**: In Partner Portal, create an event "VIP Monthly Bonus".
    *   **Cooldown**: Set to **720 hours** (30 days).
    *   **Save**.
3.  **Deploy Drop**: In the `#vip-lounge` channel, run the generated `/drop` command.
4.  **Result**: Only VIPs can see the button. Non-VIPs don't even know it exists.

---

## Level 4: "The Quest" (Advanced)
**Best for:** Driving traffic from Discord to your website/app.

Instead of rewarding the click inside Discord, use Discord as the *starting point* for an external action.

### Steps
1.  **Create Event**: Create a standard "Page Visit" or "Form Submission" event in the Portal (e.g., "Read Blog Post").
2.  **Deploy Link**: Instead of using `/drop`, post a regular message in Discord with a link:
    > 📜 **New Quest Available!**
    > Read our latest roadmap update to earn 100 LTZ!
    > [Click here to read and claim](https://yourbrand.com/blog/roadmap)
3.  **Result**:
    *   User clicks link -> Visits site.
    *   The Loyalteez widget on your site detects the visit and awards the points.
    *   (Optional) The bot doesn't need to do anything, the reward happens on-chain via your site.

---

## Level 5: Passive Tracking (Expert / Developer)
**Best for:** "Reward for every 100 messages", "Reward for Voice Chat time", "Reward for Server Boosting".

**The Challenge**: This standard bot is "Serverless" (Cloudflare Worker). It sleeps until someone runs a command. It **cannot** watch chat 24/7 to count messages.

### Solution: The Gateway Bridge
To track passive events, you need a "Gateway" that runs 24/7.

#### Option A: No-Code (Zapier/Make)
1.  **Trigger**: Use Zapier with a Discord integration ("New Message in Channel").
2.  **Action**: Send a Webhook to Loyalteez API (`https://api.loyalteez.app/loyalteez-api/manual-event`).
    *   *Note: This can get expensive with Zapier credits for high-volume chat.*

#### Option B: Custom Node.js Bot
If you are a developer, you can build a simple `discord.js` bot that listens for events and calls our API.

```javascript
// Example: Reward voice chat (pseudo-code)
client.on('voiceStateUpdate', (oldState, newState) => {
  if (userJoined) startTimer(user);
  if (userLeft) {
    const minutes = stopTimer(user);
    if (minutes > 60) {
       // Call Loyalteez API to reward 'voice_chat_1hr'
       loyalteez.sendEvent('voice_chat_1hr', `discord_${user.id}@loyalteez.app`);
    }
  }
});
```

---

## Summary of Commands

| Command | Description | Setup Required? |
|---|---|---|
| `/join` | Claims welcome bonus | Uses default `discord_join` rule (or map custom event to it) |
| `/daily` | Claims daily reward | **Yes**: Run `/daily-config` to bind it to your event |
| `/drop` | Creates a reward button | **Yes**: Needs an Event ID from Partner Portal |
| `/claim` | Manual claim (typing ID) | **Yes**: Needs an Event ID |
| `/balance` | Shows user balance | No setup required |
