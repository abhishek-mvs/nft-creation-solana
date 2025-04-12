import fs from 'fs';
import bs58 from 'bs58';

// 🔁 Replace this with your actual Base64 secret key
const base64SecretKey = '2Am3nMzdqBpo5fZr1w8b1qjawUdXaAwfkXxuPrJzv4NHLfkR2YEdnvWrsHsZJHjDYCm9P569gdW7uXpM6Bh7Q92s'; // Example

const secretKey = bs58.decode(base64SecretKey);
const j = new Uint8Array(secretKey.buffer, secretKey.byteOffset, secretKey.byteLength / Uint8Array.BYTES_PER_ELEMENT);

// Save to keypair.json
fs.writeFileSync('keypair.json', `[${j}]`);
console.log('✅ keypair.json created!');