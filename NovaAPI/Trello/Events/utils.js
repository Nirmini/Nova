// Shared utilities for Trello event handlers

/**
 * Converts a Trello color string (e.g. "sky_blue") to a human-readable label.
 * @param {string|null} color
 * @returns {string}
 */
function prettifyColor(color) {
    if (!color) return 'No Color';
    return color
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

module.exports = { prettifyColor };
