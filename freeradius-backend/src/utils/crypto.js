// freeradius-backend/src/utils/crypto.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8');
const IV = Buffer.from(process.env.ENCRYPTION_IV, 'utf8');

const encrypt = (text) => {
    if (!text) return null;
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null; // Return null if decryption fails
    }
};

module.exports = { encrypt, decrypt };