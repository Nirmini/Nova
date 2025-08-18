const settings = require('../../settings.json');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.RBT_EVNTS;

/**
 * TO DO
 * Add Team Number to ID
 * Add TeamId to Awards [VIQRC/VRC]
 * Add TeamId to TeamInfo [VIQRC/VRC]
 */

/**
 * Converts a VEX Robotics Team Number to Team ID
 * @param {string} teamID - The team number of the team.
 * @returns {Promise<string>} - The data of the team.
 */
async function Number2ID(teamID) {
    // Fetch Team Data First (Needed for Awards Too)
    const teamResponse = await axios.get(`https://www.robotevents.com/api/v2/teams`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        params: {
            'number[]': teamID,
            registered: true,
            myTeams: false,
        }
    });

    // Ensure the team exists
    if (!teamResponse.data || teamResponse.data.data.length === 0) {
        return false
    }

    return teamResponse.data.data[0]; // First team found
}

const awardsResponse = await axios.get(`https://www.robotevents.com/api/v2/teams/${team.id}/awards`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
});
const awards = awardsResponse.data.data;
// If no awards found
if (!awards || awards.length === 0) {
    return null
};

module.exports = {

}