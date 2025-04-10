import {
    createV1,
    mintV1,
    printV1,
    TokenStandard,
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
    generateSigner,
    percentAmount,
    keypairIdentity,
    createSignerFromKeypair,
    publicKey
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

// Load collection data
let collectionData;
try {
    collectionData = JSON.parse(fs.readFileSync('./collection-data.json', 'utf8'));
    console.log('Collection data loaded successfully');
    console.log(`Collection max supply: ${collectionData.maxSupply}`);
    console.log(`Current supply: ${collectionData.currentSupply}`);
} catch (error) {
    console.error('Failed to load collection data. Have you created a collection first?');
    process.exit(1);
}

// Function to mint a new NFT from the collection
async function mintNftFromCollection(recipientAddress) {
    try {
        // Check if we've reached the max supply
        if (collectionData.currentSupply >= collectionData.maxSupply) {
            console.error('Cannot mint more NFTs: maximum supply reached');
            return;
        }

        // Recreate collection mint signer from saved data
        const collectionMintSecretKey = new Uint8Array(collectionData.mintSecretKey);
        const collectionMintPubkey = publicKey(collectionData.mint);
        console.log("collectionMintPubkey: ", collectionMintPubkey)        // Generate a new mint for this NFT
        const nftMint = generateSigner(umi);
        console.log('New NFT Mint Address:', nftMint.publicKey.toString());
        console.log('New NFT Mint Secret Key:', Array.from(nftMint.secretKey));
        
        // NFT Metadata - You can customize this or generate unique metadata for each NFT
        const tokenNumber = collectionData.currentSupply + 1;
        const nftMetadata = {
            name: `Sleepy Chica`,
            symbol: "Chica",
            uri: `https://gateway.irys.xyz/CZkXnFospC5jakQf3k69uaQcx1M3YTv6A8MJ1Lbx2TVw`, // Replace with actual metadata URI
            tokenNumber: tokenNumber, 
        };

        // Create the NFT that belongs to the collection
        console.log('Creating new NFT...');
        const createTx = await createV1(umi, {
            mint: nftMint,
            authority: umi.identity,
            payer: umi.identity,
            updateAuthority: umi.identity,
            name: nftMetadata.name,
            symbol: nftMetadata.symbol,
            uri: nftMetadata.uri,
            isMutable: true,
            maxSupply: 100,
            sellerFeeBasisPoints: percentAmount(5.5), // 5.5% royalty
            tokenStandard: TokenStandard.NonFungible,
            collection: {
                key: collectionMintPubkey,
                verified: false,
            }
        }).sendAndConfirm(umi);
        
        const createTxSig = base58.deserialize(createTx.signature);
        console.log(`NFT Created: https://explorer.solana.com/tx/${createTxSig}?cluster=devnet`);
        
        // Mint the token to the recipient
        const recipient = recipientAddress ? publicKey(recipientAddress) : umi.identity.publicKey;
        console.log(`Minting NFT to recipient: ${recipient.toString()}`);
        
        const mintTx = await mintV1(umi, {
            mint: nftMint.publicKey,
            authority: umi.identity,
            payer: umi.identity,
            amount: 1, // NFTs have amount 1
            tokenOwner: recipient,
            tokenStandard: TokenStandard.NonFungible,
        }).sendAndConfirm(umi);
        
        const mintTxSig = base58.deserialize(mintTx.signature);
        console.log(`NFT Minted: https://explorer.solana.com/tx/${mintTxSig}?cluster=devnet`);
        
        // Update the collection supply counter
        collectionData.currentSupply += 1;
        fs.writeFileSync('./collection-data.json', JSON.stringify(collectionData, null, 2));
        
        console.log('NFT minted successfully!');
        console.log(`New supply count: ${collectionData.currentSupply}/${collectionData.maxSupply}`);
        
        return {
            mint: nftMint.publicKey.toString(),
            owner: recipient.toString(),
            mintTx: mintTxSig
        };
    } catch (error) {
        console.error('Error minting NFT:', error);
    }
}

async function mintNftFromCollectionAndMintAdditionalTokens(recipientAddress, mintAddress, mintAmount) {
    try {
        const mintPubkey = publicKey(mintAddress);
        const recipient = recipientAddress ? publicKey(recipientAddress) : umi.identity.publicKey;
        console.log(`Minting NFT to recipient: ${recipient.toString()}`);
        
        const mintTx = await mintV1(umi, {
            mint: mintPubkey,
            authority: umi.identity,
            payer: umi.identity,
            amount: mintAmount, // NFTs have amount 1
            tokenOwner: recipient,
            tokenStandard: TokenStandard.NonFungible,
        }).sendAndConfirm(umi);
        
        const mintTxSig = base58.deserialize(mintTx.signature);
        console.log(`NFT Minted: https://explorer.solana.com/tx/${mintTxSig}?cluster=devnet`);
        
        // Update the collection supply counter
        collectionData.currentSupply += 1;
        fs.writeFileSync('./collection-data.json', JSON.stringify(collectionData, null, 2));
        
        console.log('NFT minted successfully!');
        console.log(`New supply count: ${collectionData.currentSupply}/${collectionData.maxSupply}`);
        
        return {
            mint: nftMint.publicKey.toString(),
            owner: recipient.toString(),
            mintTx: mintTxSig
        };
    } catch (error) {
        console.error('Error minting NFT:', error);
    }
}

// Example usage: 
// To mint to yourself (the creator): 
// mintNftFromCollection();
// 
// To mint to another address:
// mintNftFromCollection('RECIPIENT_WALLET_ADDRESS');

// Parse command line arguments to get recipient address
const args = process.argv.slice(2);
const recipientAddress = args[0]; // Optional recipient address
const mintAddress = args[1];
const mintAmount = args[2];

// Run the minting function
mintNftFromCollection(recipientAddress); 

// mintNftEdition(recipientAddress, mintAddress);