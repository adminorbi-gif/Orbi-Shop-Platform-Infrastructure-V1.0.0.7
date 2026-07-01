const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

// The test key provided by the user
const TEST_KEY = 'qqykCM9whFSnTJDxNXsbXcNNR6sMd6ws';
// Fallback keys in case we want to test them as well
const FALLBACK_KEY = 'orbi_paysafe_secure_encryption_key_2026_v1_fallback';
const DEFAULT_SECRET_KEY = 'default-super-secret-key-32-chars';

const SALTS = ['orbi-shop-v1', 'salt'];

const testEncryptedStrings = [
  '7faf117eaf3d0b07d463acd7:c17a321b2011010d21cce0c339fa6dc5:b5ddd5716a38c7c6998495c948d835f5194a0a26c0ad',
  '5c399c7477ae3c3a2e309123:6dde77dc52d0e12cc52fb47701e2765d:c9a101ff4b1221a17d3f', // previously failed example
  '08c1c228b90882918e83fc67:c8ee6d866484311b6733283f56d66699:1be30b36f7b89841924ea8a6', // customer_name from db
];

function testKeyDecryption(keyStr, salt, encryptedText) {
  try {
    const key = crypto.scryptSync(keyStr, salt, KEY_LENGTH);
    let cleanText = encryptedText;
    
    if (encryptedText.startsWith('$2a$encrypted:')) {
      cleanText = encryptedText.substring(14);
    }
    
    const [ivHex, tagHex, encrypted] = cleanText.split(':');
    
    if (!ivHex || !tagHex || !encrypted) {
      console.log(`[!] Invalid format for encrypted text`);
      return false;
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log(`[SUCCESS] Decrypted successfully!`);
    console.log(`  Key: ${keyStr}`);
    console.log(`  Salt: ${salt}`);
    console.log(`  Original: ${encryptedText}`);
    console.log(`  Decrypted: ${decrypted}`);
    console.log('--------------------------------------------------');
    return true;
  } catch(e) {
    // console.log(`[FAIL] Key: ${keyStr} | Salt: ${salt} | Error: ${e.message}`);
    return false;
  }
}

console.log('Starting decryption tests...\n');

let foundMatch = false;

for (const encryptedText of testEncryptedStrings) {
  console.log(`Testing encrypted string: ${encryptedText}`);
  
  const keysToTest = [TEST_KEY, FALLBACK_KEY, DEFAULT_SECRET_KEY];
  
  for (const key of keysToTest) {
    for (const salt of SALTS) {
      if (testKeyDecryption(key, salt, encryptedText)) {
        foundMatch = true;
      }
    }
  }
}

if (!foundMatch) {
  console.log('\n[FAIL] None of the keys and salts combinations could decrypt the test strings.');
  console.log('This means the data in the database was encrypted with a different key, salt, or algorithm than what is currently being tested.');
}
