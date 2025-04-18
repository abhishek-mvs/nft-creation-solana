import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, percentAmount, createSignerFromKeypair, createGenericFile } from '@metaplex-foundation/umi'
import {
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata'
import { signerIdentity } from '@metaplex-foundation/umi'
import { Keypair } from '@solana/web3.js'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import fs from 'fs'
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata'

// Load keypair from keypair.json file
const keypairData = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));



console.log('Creator address:', keypair.publicKey.toString())

// Use devnet RPC endpoint
const umi = createUmi('https://api.devnet.solana.com')
  .use(mplTokenMetadata())
  .use(irysUploader({
    address: "https://devnet.irys.xyz",
  }))

// Create signer from existing keypair and set it as the identity
const signer = createSignerFromKeypair(umi, keypair)
umi.use(signerIdentity(signer))

// Generate a new keypair for the mint
const mint = generateSigner(umi)
console.log('NFT Mint Address:', mint.publicKey)

async function uploadImage(imageLocation, name, description, attributes) {
  try {
    // Upload the image
    console.log('Reading image file...')
    const imageFile = fs.readFileSync(imageLocation)
    console.log('Image file size:', imageFile.length, 'bytes')
    
    const umiImageFile = createGenericFile(imageFile, 'chica.jpeg', {
      tags: [{ name: 'Content-Type', value: 'image/jpeg' }],
    })
    
    console.log('Starting image upload...')
    const [imageUri] = await umi.uploader.upload([umiImageFile])
    console.log('Image upload completed. URI:', imageUri)

    // Upload the metadata
    console.log('Starting metadata upload...')
    const uri = await umi.uploader.uploadJson({
      name: name,
      description: description,
      image: imageUri,
      attributes: attributes
    })
    console.log('Metadata upload completed. URI:', uri)
   
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
  }
}

// Execute the async function using an IIFE to handle top-level await
(async () => {
  await uploadImage('./chica.jpeg', 'Chica', 'Chica is the cutest dog', [
    { trait_type: 'Type', value: 'Poodle' },
    { trait_type: 'Color', value: 'Brown' },
    { trait_type: 'State', value: 'Sleeping' }
  ])
  await uploadImage('./chica-3day-s.jpeg', 'Chica', 'Chica says: Good streak, keep it up! Tail wags of approval!', [
    { trait_type: 'Type', value: 'Poodle' },
    { trait_type: 'Color', value: 'Brown' },
    { trait_type: 'State', value: 'Cheering' },
    { trait_type: 'Streak', value: '3 days' }
  ])
  await uploadImage('./chica-7day-s.jpeg', 'Chica', 'Chica says: One week strong! Let’s sniff out greatness!', [
    { trait_type: 'Type', value: 'Poodle' },
    { trait_type: 'Color', value: 'Brown' },
    { trait_type: 'State', value: 'Cheering' },
    { trait_type: 'Streak', value: '7 days' }
  ])
  await uploadImage('./chica-30day-s.jpeg', 'Chica', 'Chica says: 30 days?! You’re pawsitively unstoppable!', [
    { trait_type: 'Type', value: 'Poodle' },
    { trait_type: 'Color', value: 'Brown' },
    { trait_type: 'State', value: 'Cheering' },
    { trait_type: 'Streak', value: '30 days' }
  ])
})();