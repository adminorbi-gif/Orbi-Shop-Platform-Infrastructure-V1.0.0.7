import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // For GCM
const KEY_LENGTH = 32; // 256 bits

// Ensure key is 32 bytes
const getEncryptionKey = () => {
  const key = (typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) || "orbi_paysafe_secure_encryption_key_2026_v1_fallback";
  const salt = (typeof process !== 'undefined' && process.env?.ENCRYPTION_SALT) || "orbi-shop-v1";

  return crypto.scryptSync(key, salt, KEY_LENGTH);
};

export const encrypt = (text: string, isPassword = false): string => {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:content
  const result = `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  return isPassword ? `$2a$encrypted:${result}` : result;
};

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  try {
    let cleanText = encryptedText;
    if (encryptedText.startsWith('$2a$encrypted:')) {
      cleanText = encryptedText.substring('$2a$encrypted:'.length);
    }
    const [ivHex, tagHex, encrypted] = cleanText.split(':');
    if (!ivHex || !tagHex || !encrypted) return encryptedText; // Assume not encrypted

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    // Try fallbacks
    try {
      let cleanText = encryptedText;
      if (encryptedText.startsWith('$2a$encrypted:')) {
        cleanText = encryptedText.substring('$2a$encrypted:'.length);
      }
      const [ivHex, tagHex, encrypted] = cleanText.split(':');
      if (!ivHex || !tagHex || !encrypted) return encryptedText;

      const keysToTry = [
        // 1. Current key but with original 'salt'
        crypto.scryptSync((typeof process !== 'undefined' && process.env?.ENCRYPTION_KEY) || "orbi_paysafe_secure_encryption_key_2026_v1_fallback", "salt", KEY_LENGTH),
        // 2. Original default key and salt
        crypto.scryptSync("default-super-secret-key-32-chars", "salt", KEY_LENGTH),
        // 3. Current fallback
        crypto.scryptSync("orbi_paysafe_secure_encryption_key_2026_v1_fallback", "orbi-shop-v1", KEY_LENGTH)
      ];

      for (const fallbackKey of keysToTry) {
        try {
          const decipher = crypto.createDecipheriv(
            ALGORITHM,
            fallbackKey,
            Buffer.from(ivHex, 'hex')
          );
          decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
          
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted; // Return on first successful decryption
        } catch (err) {
          // Continue to next key
        }
      }

      // If all fallbacks fail, return raw text
      return encryptedText;
    } catch (fallbackError) {
      return encryptedText;
    }
  }
};

export const decryptIfEncrypted = (text: any): any => {
  if (typeof text !== 'string') return text;
  if (!text.includes(':')) return text;
  
  let cleanText = text;
  if (text.startsWith('$2a$encrypted:')) {
    cleanText = text.substring('$2a$encrypted:'.length);
  }
  
  const parts = cleanText.split(':');
  if (parts.length === 3) {
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (hexRegex.test(parts[0]) && hexRegex.test(parts[1])) {
      try {
        const dec = decrypt(text);
        if (dec !== text) {
          return dec;
        } else {
          return "[Encrypted Data]";
        }
      } catch {
        return "[Encrypted Data]";
      }
    }
  }
  return text;
};

export const decryptObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return decryptIfEncrypted(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => decryptObject(item));
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = decryptObject(obj[key]);
    }
    return res;
  }
  return obj;
};
