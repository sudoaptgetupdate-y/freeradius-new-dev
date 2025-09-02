// freeradius-backend/src/utils/mikrotikUtils.js

/**
 * Encodes a UTF-8 string into a consistent hexadecimal format for Mikrotik comments.
 * This ensures all characters (Thai, English, numbers, symbols) are stored safely.
 * @param {string} str The string to encode.
 * @returns {string} The hex-encoded string.
 */
const encodeToMikrotikHex = (str) => {
    if (!str) return '';
    // Convert the entire string to a hex representation of its UTF-8 bytes.
    return Buffer.from(str, 'utf8').toString('hex');
};

/**
 * Decodes a hex string from a Mikrotik comment back to a UTF-8 string.
 * It includes a fallback to handle non-encoded legacy comments.
 * @param {string} hex The hex string to decode.
 * @returns {string} The decoded UTF-8 string.
 */
const decodeFromMikrotikHex = (hex) => {
    if (!hex) return '';

    // Check if the string is potentially hex-encoded (even number of hex characters).
    // This is a simple check; more robust validation could be added if needed.
    const isHex = /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0;

    if (isHex) {
        try {
            // Attempt to decode from hex.
            const decodedStr = Buffer.from(hex, 'hex').toString('utf8');
            return decodedStr;
        } catch (error) {
            // If decoding fails for any reason, return the original string.
            return hex;
        }
    }

    // If it's not a valid hex string, it's likely a legacy comment that wasn't encoded.
    return hex;
};

module.exports = {
    encodeToMikrotikHex,
    decodeFromMikrotikHex,
};