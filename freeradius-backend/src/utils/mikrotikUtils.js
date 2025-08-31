// freeradius-backend/src/utils/mikrotikUtils.js

/**
 * Encodes a UTF-8 string into MikroTik-compatible hexadecimal escape sequences.
 */
const encodeToMikrotikHex = (str) => {
    if (!str) {
        return '';
    }
    // Buffer.from handles the UTF-8 string to bytes conversion.
    const buffer = Buffer.from(str, 'utf8');
    let hexString = '';
    for (const byte of buffer) {
        // Convert each byte to a two-digit uppercase hexadecimal string, prefixed with '\\'.
        hexString += '\\' + byte.toString(16).padStart(2, '0').toUpperCase();
    }
    return hexString;
};

/**
 * Decodes a MikroTik-compatible hexadecimal string back to a UTF-8 string.
 * This new version is more robust and correctly handles the hex format.
 */
const decodeFromMikrotikHex = (hexStr) => {
    // 1. Validate input: Check if it's a string and seems to be in our hex format.
    //    Thai characters in UTF-8 hex often start with '\E0', making it a good check.
    if (typeof hexStr !== 'string' || !hexStr.startsWith('\\E0')) {
        return hexStr || '';
    }

    try {
        // 2. Clean the string: Remove all backslash characters ('\') to get a pure hex string.
        const cleanedHex = hexStr.replace(/\\/g, '');

        // 3. Validate format: Ensure the cleaned string contains only valid hex characters.
        if (/[^0-9A-F]/i.test(cleanedHex)) {
            return hexStr; // Return original if it contains non-hex characters after cleaning.
        }

        // 4. Convert: Use Buffer.from with 'hex' encoding to directly convert the hex string to bytes.
        const buffer = Buffer.from(cleanedHex, 'hex');
        
        // 5. Decode: Convert the buffer of bytes back to a readable UTF-8 string.
        return buffer.toString('utf8');

    } catch (error) {
        // In case of any unexpected error during conversion, log it and return the original string.
        console.error("Failed to decode Mikrotik hex string:", hexStr, error);
        return hexStr;
    }
};

module.exports = {
    encodeToMikrotikHex,
    decodeFromMikrotikHex,
};