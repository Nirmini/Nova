// ../src/modules/subscriptions.js
const { EventEmitter } = require('events');
const {
  setSubscriptionData,
  getSubscriptionData,
  removeSubscriptionData
} = require('./Database'); // adjust if path differs
require('../mainapp/sentry');

const subscriptionEmitter = new EventEmitter();

/**
 * Called when Discord notifies us of an entitlement event (purchase/change/cancel).
 * @param {import('discord.js').Entitlement} entitlement 
 */
async function handleEntitlement(entitlement) {
  const expiresAt = entitlement.endsAt?.getTime() || Infinity;
  const renewalAt = entitlement.startsAt?.getTime() || null; // optional: when renewal began
  const data = {
    plan: entitlement.skuId,
    expiresAt,
    renewalAt,
    guildId: entitlement.guildId || null,
    userId: entitlement.userId || null
  };

  if (entitlement.guildId) {
    await setSubscriptionData('GuildDiscordSubs', entitlement.guildId, data);
    subscriptionEmitter.emit('purchased', { type: 'guild', id: entitlement.guildId, ...data });
  } else if (entitlement.userId) {
    await setSubscriptionData('UserSubs', entitlement.userId, data);
    subscriptionEmitter.emit('purchased', { type: 'user', id: entitlement.userId, ...data });
  }
}

/**
 * Check if a guild currently has an active subscription.
 */
async function hasGuildSubscription(guildId) {
  const sub = await getSubscriptionData('GuildDiscordSubs', guildId);
  return sub ? sub.expiresAt > Date.now() : false;
}

/**
 * Check if a user currently has an active subscription.
 */
async function hasUserSubscription(userId) {
  const sub = await getSubscriptionData('UserSubs', userId);
  return sub ? sub.expiresAt > Date.now() : false;
}

/**
 * Remove a subscription (e.g. on cancel).
 */
async function removeSubscription(type, id) {
  if (type === 'guild') {
    await removeSubscriptionData('GuildDiscordSubs', id);
  } else if (type === 'user') {
    await removeSubscriptionData('UserSubs', id);
  }
}

/**
 * Register a listener for subscription purchases/updates.
 */
function onSubscriptionPurchase(callback) {
  subscriptionEmitter.on('purchased', callback);
}

module.exports = {
  handleEntitlement,
  hasGuildSubscription,
  hasUserSubscription,
  removeSubscription,
  onSubscriptionPurchase
};
