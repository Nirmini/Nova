const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Get the price of a Stripe product by product ID.
 * @param {string} productId
 * @returns {Promise<number|null>} Price in the smallest currency unit (e.g., cents), or null if not found.
 */
async function getProductPrice(productId) {
    try {
        const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
        if (prices.data.length > 0) {
            return prices.data[0].unit_amount;
        }
        return null;
    } catch (err) {
        console.error("Stripe getProductPrice error:", err);
        return null;
    }
}

/**
 * Check if a user owns a given Stripe product (one-time purchase).
 * @param {string} stripeCustomerId
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
async function userOwnsProduct(stripeCustomerId, productId) {
    try {
        const charges = await stripe.charges.list({
            customer: stripeCustomerId,
            limit: 100,
        });
        for (const charge of charges.data) {
            if (charge.paid && charge.invoice) {
                const invoice = await stripe.invoices.retrieve(charge.invoice);
                if (invoice.lines && invoice.lines.data) {
                    for (const line of invoice.lines.data) {
                        if (line.price && line.price.product === productId) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    } catch (err) {
        console.error("Stripe userOwnsProduct error:", err);
        return false;
    }
}

/**
 * Check if a user owns an active subscription to a given Stripe product.
 * @param {string} stripeCustomerId
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
async function userHasActiveSubscription(stripeCustomerId, productId) {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
            limit: 100,
        });
        for (const sub of subscriptions.data) {
            if (sub.status === 'active' || sub.status === 'trialing') {
                for (const item of sub.items.data) {
                    if (item.price.product === productId) {
                        return true;
                    }
                }
            }
        }
        return false;
    } catch (err) {
        console.error("Stripe userHasActiveSubscription error:", err);
        return false;
    }
}

module.exports = {
    getProductPrice,
    userOwnsProduct,
    userHasActiveSubscription,
};