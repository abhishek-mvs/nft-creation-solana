import {
    createV1,
    findMetadataPda,
    mplTokenMetadata,
    TokenStandard,
    fetchDigitalAsset
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
    generateSigner,
    percentAmount,
    keypairIdentity,
    createSignerFromKeypair,
    publicKey
} from "@metaplex-foundation/umi";
import { PublicKey } from "@metaplex-foundation/js";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

const umi = createUmi("https://api.devnet.solana.com")
    .use(mplTokenMetadata())
    .use(mplToolbox());

// Load creator keypair
const keypairData = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));
const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(keypairData, 'hex'));

console.log('Creator address:', keypair.publicKey.toString());
umi.use(keypairIdentity(keypair));

async function fetchNftMetadata() {
    try {
        const mintAddress = new PublicKey(
            "CHtoyS3DykTcEi6jTgFP6hhJyG55AKwAUVzJLexafKxz",
      );
  
      console.log("Fetching NFT metadata...");
      const asset = await fetchDigitalAsset(umi, mintAddress);
  
      console.log("NFT Metadata:");
  
      // If you want to access specific metadata fields:
      console.log("\nName:", asset.metadata.name);
      console.log("Symbol:", asset.metadata.symbol);
      console.log("URI:", asset.metadata.uri);
  
      // Fetch and log the JSON metadata
      if (asset.metadata.uri) {
        const response = await fetch(asset.metadata.uri);
        const jsonMetadata = await response.json();
        console.log("\nJSON Metadata:");
        console.log(JSON.stringify(jsonMetadata, null, 2));
        const imageUri = jsonMetadata.image;
        console.log("Image URI:", imageUri);
        const imageResponse = await fetch(imageUri);
        const imageBuffer = await imageResponse.arrayBuffer();
        fs.writeFileSync('image.png', Buffer.from(imageBuffer));
        console.log("Image saved as image.png");
      }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchNftMetadata();