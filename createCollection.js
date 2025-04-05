import {
    createV1,
    findMetadataPda,
    mplTokenMetadata,
    TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
    generateSigner,
    percentAmount,
    keypairIdentity,
    createSignerFromKeypair
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Initialize UMI
const umi = createUmi("https://api.devnet.solana.com")
    .use(mplTokenMetadata())
    .use(mplToolbox());

// Load creator keypair
const keypairData = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));
const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(keypairData, 'hex'));

console.log('Creator address:', keypair.publicKey.toString());
umi.use(keypairIdentity(keypair));

// Generate collection NFT signer
const collectionMint = generateSigner(umi);
console.log('Collection Mint Address:', collectionMint.publicKey.toString());
console.log('Collection Mint Secret Key:', Array.from(collectionMint.secretKey));

// Save collection mint for future reference
const collectionData = {
    mint: collectionMint.publicKey,
    mintSecretKey: Array.from(collectionMint.secretKey),
    maxSupply: 100,
    currentSupply: 0
};

// Collection Metadata
const collectionMetadata = {
    name: "Sleepy Chica",
	symbol: "Chica!!",
	uri: "https://gateway.irys.xyz/CZkXnFospC5jakQf3k69uaQcx1M3YTv6A8MJ1Lbx2TVw", // Replace with your actual metadata URI
};

// Create the collection NFT
async function createCollectionNft() {
    try {
        // Create the collection NFT
        console.log('Creating collection NFT...');
        console.log('umi.identity', umi.identity);
        const tx = await createV1(umi, {
            mint: collectionMint,
            authority: umi.identity,
            payer: umi.identity,
            updateAuthority: umi.identity,
            name: collectionMetadata.name,
            symbol: collectionMetadata.symbol,
            uri: collectionMetadata.uri,
            sellerFeeBasisPoints: percentAmount(5.5), // 5.5% royalty
            isCollection: true,
            tokenStandard: TokenStandard.NonFungible,
        }).sendAndConfirm(umi);
        
        console.log('Collection NFT created successfully!');
        const txSig = base58.deserialize(tx.signature);
        console.log(`Transaction: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
        
        // Save collection data to a file for future reference
        fs.writeFileSync(
            './collection-data.json', 
            JSON.stringify(collectionData, null, 2)
        );
        
        console.log('Collection data saved to collection-data.json');
        console.log(`Collection max supply: ${collectionData.maxSupply}`);
        console.log(`Current supply: ${collectionData.currentSupply}`);
        
    } catch (error) {
        console.error('Error creating collection NFT:', error);
    }
}

// Run the function
createCollectionNft(); 