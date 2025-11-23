# 🧪 Loyalteez Discord Integration Recipes

This guide provides "recipes" for integrating Loyalteez into your Discord community, ranging from simple drops to complex, multi-stage quests.

---

## Level 1: The "Drop" (Basic)
**Best for:** AMAs, Live Events, Flash Giveaways, Polls.

The simplest way to reward users. You create a button, they click it, they get points.

### Steps
1.  **Create Event**: In Partner Portal -> Settings -> Events, create a Custom Event (e.g., "AMA Attendee", ID: `ama_august`).
2.  **Deploy Drop**: In your Discord event channel, run:
    ```
    /drop event_id:ama_august label:"I'm here! (50 LTZ)" description:"Thanks for joining our August AMA! Click below to claim your attendance points."
    ```
3.  **Result**: Users click the button and receive 50 LTZ instantly.

---

## Level 2: Role-Based Rewards (Intermediate)
**Best for:** Rewarding VIPs, OG members, or specific role holders.

Since the bot handles permissions via Discord's native channel settings, you can gate rewards by role easily.

### Steps
1.  **Create Private Channel**: Create a channel (e.g., `#vip-lounge`) visible only to the "VIP" role.
2.  **Create Event**: Create an event "VIP Monthly Bonus" (ID: `vip_bonus_sept`) with a **30-day cooldown**.
3.  **Deploy Drop**: In `#vip-lounge`, run:
    ```
    /drop event_id:vip_bonus_sept label:"Claim Monthly VIP Bonus" description:"Exclusive reward for our VIP members."
    ```
4.  **Result**: Only VIPs can see the channel and click the button. The cooldown ensures they can only claim once per month.

---

## Level 3: "The Quest" (Advanced)
**Best for:** Driving traffic from Discord to your website/app.

Instead of rewarding the click immediately, you use Discord as the starting point for an external action.

### Steps
1.  **Create Event**: Create an event "Website Quest" (ID: `site_visit`).
2.  **Setup**: Ensure your website has the Loyalteez SDK installed.
3.  **Deploy Drop (Link)**: Instead of a `/drop` (which claims instantly), post a standard message with a link:
    *   "Quest: Visit our new shop to earn 100 LTZ! [Click Here](https://yourstore.com/shop?utm_source=discord)"
4.  **Result**:
    *   User clicks link -> Visits site.
    *   Loyalteez SDK on your site detects the visit (via `page_view` or specific action).
    *   User earns points on the site.
    *   **Bot Notification**: If you want the bot to announce it, you can use a Webhook (see Level 4).

---

## Level 4: Passive Tracking & Gateways (Expert)
**Best for:** "Reward for every 100 messages", "Reward for Voice Chat time", "Reward for Server Boosting".

**The Challenge**: This bot is "Serverless" (Cloudflare Worker), meaning it only wakes up when someone runs a command or clicks a button. It cannot "watch" chat or voice channels passively.

### Solution: The Gateway Bridge
To track passive events, you need a 24/7 "Gateway Bot" or a bridge integration.

#### Option A: Use an Automation Bot (Zapier/Make)
1.  **Trigger**: Use a tool like Zapier with a Discord integration ("New Message in Channel" or "User Assigned Role").
2.  **Action**: Webhook to Loyalteez API.
    *   **URL**: `https://api.loyalteez.app/loyalteez-api/manual-event`
    *   **Payload**:
        ```json
        {
          "brandId": "YOUR_BRAND_WALLET",
          "eventType": "discord_message",
          "userEmail": "discord_USER_ID@loyalteez.app", 
          "metadata": { "source": "zapier" }
        }
        ```
    *   *Note: You need the user's Discord ID to construct the email.*

#### Option B: Custom Gateway Bot
If you are a developer, you can build a simple Node.js bot using `discord.js` that listens for events and calls the Loyalteez API.

```javascript
client.on('voiceStateUpdate', (oldState, newState) => {
  // Logic to track time...
  // When 1 hour reached:
  loyalteez.sendEvent('voice_chat_1hr', `discord_${userId}@loyalteez.app`);
});
```

---

## Level 5: Physical Event / POAP Style
**Best for:** IRL events, Conferences.

### Steps
1.  **Create QR Code**: Create a QR code that links to a deep link or a specific command trigger (requires advanced bot setup) OR simply links to your website with a unique query param.
2.  **User Scans**: User scans QR code -> Lands on a claim page.
3.  **Claim**: User logs in with Discord on that page -> API triggers reward -> Bot sends DM (if configured) "You claimed the IRL Event Badge!".

---

## Summary of Event Types

| Event ID (Example) | Trigger Type | Best For |
|---|---|---|
| `discord_join` | Command (`/join`) | Onboarding new members |
| `daily_checkin` | Command (`/daily`) | Retention / Daily Engagement |
| `ama_attendance` | Button (`/drop`) | Live events, Webinars |
| `vip_bonus` | Button (Gated Channel) | Tiered rewards |
| `bug_report` | Manual (`/claim`) | Rewarding specific contributions manually |

