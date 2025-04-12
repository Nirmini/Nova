const settings = require('../../settings.json');
const axios = require('axios');
require('dotenv').config();
const RobloxKey = process.env.RBLX_KEY || "NoKey";

if (!settings.apis.roblox) {
    throw new Error("Failed to execute. RobloxAPI is disabled in local settings.");
}
if (RobloxKey === "NoKey") {
    throw new Error("No ROBLOX OpenCloud API key set in environment variables.");
}

// Base headers for Roblox API requests
const headers = {
    'x-api-key': RobloxKey,
    'Content-Type': 'application/json',
};

/**
 * Converts a Roblox User ID to a Username.
 * @param {number} userId - The Roblox User ID.
 * @returns {Promise<string>} - The username of the user.
 */
async function UserID2Name(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data.name;
    } catch (error) {
        console.error(`Error fetching username for UserID ${userId}:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Converts a Roblox Username to a User ID.
 * @param {string} username - The Roblox Username.
 * @returns {Promise<number>} - The User ID of the user.
 */
async function UserName2ID(username) {
    try {
        const response = await axios.post(
            'https://users.roblox.com/v1/usernames/users',
            { usernames: [username], excludeBannedUsers: false },
            { headers }
        );
        if (response.data.data.length > 0) {
            return response.data.data[0].id;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching UserID for Username ${username}:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Fetches the avatar thumbnail URL for a Roblox User ID.
 * @param {number} userId - The Roblox User ID.
 * @returns {Promise<string>} - The URL of the avatar thumbnail.
 */
async function AvatarThumbnail(userId) {
    try {
        const response = await axios.get('https://thumbnails.roblox.com/v1/users/avatar', {
            params: {
                userIds: userId,
                size: '420x420',
                format: 'Png',
                isCircular: false,
            },
        });
        if (response.data && response.data.data.length > 0) {
            return response.data.data[0].imageUrl;
        }
        return 'https://tr.rbxcdn.com/default-avatar.png'; // Default avatar
    } catch (error) {
        console.error(`Error fetching avatar thumbnail for UserID ${userId}:`, error.response?.data || error.message);
        return 'https://tr.rbxcdn.com/default-avatar.png'; // Default avatar
    }
}

/**
 * Fetches the join date of a Roblox user.
 * @param {number} userId - The Roblox User ID.
 * @returns {Promise<string>} - The join date of the user.
 */
async function JoinDate(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return new Date(response.data.created).toDateString();
    } catch (error) {
        console.error(`Error fetching join date for UserID ${userId}:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Fetches the total number of badges a Roblox user has.
 * @param {number} userId - The Roblox User ID.
 * @param {number} limit - The number of badges to fetch (10, 25, 50, or 100).
 * @returns {Promise<number|string>} - The total number of badges or a message if unavailable.
 */
async function GetBadges(userId, limit = 10) {
    // Validate the limit parameter
    const validLimits = [10, 25, 50, 100];
    if (!validLimits.includes(limit)) {
        console.warn(`Invalid limit value: ${limit}. Defaulting to 10.`);
        limit = 10;
    }

    try {
        const response = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges`, {
            params: { limit },
        });

        if (response.data && typeof response.data.total === 'number') {
            return response.data.total; // Return the total badge count
        }

        return 0; // Return 0 if no badges are found
    } catch (error) {
        console.error(`Error fetching badges for UserID ${userId}:`, error.response?.data || error.message);
        return 'Private or Unavailable';
    }
}

/**
 * Fetches the avatar items of a Roblox user.
 * @param {number} userId - The Roblox User ID.
 * @returns {Promise<object[]>} - A list of avatar items.
 */
async function GetAvtrItms(userId) {
    try {
        const response = await axios.get(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles`, {
            params: { limit: 10 },
        });
        return response.data.data || [];
    } catch (error) {
        console.error(`Error fetching avatar items for UserID ${userId}:`, error.response?.data || error.message);
        return [];
    }
}

/**
 * Fetches general information about a Roblox user.
 * @param {number} userId - The Roblox User ID.
 * @returns {Promise<object>} - General information about the user.
 */
async function GetGeneral(userId) {
    try {
        const userInfo = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        const avatarUrl = await AvatarThumbnail(userId);
        const badges = await GetBadges(userId);
        const joinDate = new Date(userInfo.data.created).toDateString();

        return {
            username: userInfo.data.name,
            displayName: userInfo.data.displayName,
            description: userInfo.data.description || 'No description available.',
            avatarUrl,
            badges,
            joinDate,
        };
    } catch (error) {
        console.error(`Error fetching general info for UserID ${userId}:`, error.response?.data || error.message);
        return null;
    }
}

module.exports = {
    UserID2Name,
    UserName2ID,
    AvatarThumbnail,
    JoinDate,
    GetBadges,
    GetAvtrItms,
    GetGeneral,
};