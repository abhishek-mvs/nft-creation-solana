import fs from 'fs';
import bs58 from 'bs58';

// 🔁 Replace this with your actual Base64 secret key
const base64SecretKey = 'D746Z8fZsisQamYqWpaofkRBMDMTByn6nF1tJ9FAHBTBxULV6pAZRmaZc6aXB5qWcBkVFjF6kxcJ5M6iECuAv99'; // Example

const secretKey = bs58.decode(base64SecretKey);
const j = new Uint8Array(secretKey.buffer, secretKey.byteOffset, secretKey.byteLength / Uint8Array.BYTES_PER_ELEMENT);

// Save to keypair.json
fs.writeFileSync('keypair.json', `[${j}]`);
console.log('✅ keypair.json created!');