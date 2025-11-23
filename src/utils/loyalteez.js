/**
 * Loyalteez API Client for Cloudflare Workers
 * 
 * Handles communication with the Loyalteez API using native fetch.
 */

export class LoyalteezClient {
  /**
   * @param {string} brandId - The Brand ID (wallet address)
   * @param {string} apiUrl - Base API URL (e.g. https://api.loyalteez.app)
   */
  constructor(brandId, apiUrl) {
    this.brandId = brandId;
    this.apiUrl = apiUrl || 'https://api.loyalteez.app';
    this.endpoint = `${this.apiUrl}/loyalteez-api/manual-event`;
  }

  /**
   * Send a reward event to Loyalteez
   * 
   * @param {string} eventType - The event type identifier (e.g. 'discord_join')
   * @param {string} userEmail - The user's email or unique identifier
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - The API response
   */
  async sendEvent(eventType, userEmail, metadata = {}) {
    if (!this.brandId) {
      throw new Error('Loyalteez Brand ID is not configured.');
    }

    const payload = {
      brandId: this.brandId,
      eventType,
      userEmail,
      domain: 'discord', // Static domain for Discord bot
      metadata: {
        platform: 'discord',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    console.log(`Sending Loyalteez Event: ${eventType} for ${userEmail}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Loyalteez API Error:', data);
        throw new Error(data.error || `API returned ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to send event to Loyalteez:', error);
      throw error;
    }
  }
}
