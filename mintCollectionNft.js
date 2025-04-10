import {
    createV1,
    findMetadataPda,
    mplTokenMetadata,
    TokenStandard,
    fetchMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
    generateSigner,
    percentAmount,
    keypairIdentity,
    publicKey,
    transactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
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
const collectionData = JSON.parse(fs.readFileSync('./collection-data.json', 'utf8'));
const collectionMint = publicKey(collectionData.mint);

// Function to verify collection relationship with retry
async function verifyCollection(nftMint, retries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const metadata = await fetchMetadata(umi, findMetadataPda(umi, { mint: nftMint }));
            console.log('\nVerifying collection relationship...');
            console.log('NFT Metadata:', {
                name: metadata.name,
                collection: metadata.collection,
                verified: metadata.collection?.verified
            });
            return metadata.collection?.verified;
        } catch (error) {
            if (attempt === retries) {
                console.error(`Error verifying collection after ${retries} attempts:`, error);
                return false;
            }
            console.log(`Attempt ${attempt} failed, retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

// Create multiple NFTs that belong to the collection
async function mintCollectionNfts(count = 3) {
    try {
        console.log(`Creating ${count} NFTs that belong to collection...`);
        
        const nfts = [];
        const txBuilder = transactionBuilder();
        
        // Generate and prepare NFTs
        for (let i = 1; i <= count; i++) {
            const nftMint = generateSigner(umi);
            console.log(`NFT #${i} Mint Address:`, nftMint.publicKey.toString());
            
            const nftMetadata = {
                name: `Sleepy Chica #${i}`,
                symbol: "Chica!!",
                uri: "https://gateway.irys.xyz/CZkXnFospC5jakQf3k69uaQcx1M3YTv6A8MJ1Lbx2TVw", // Replace with your actual metadata URI
            };
            
            // Add create instruction to transaction
            txBuilder.add(
                createV1(umi, {
                    mint: nftMint,
                    authority: umi.identity,
                    payer: umi.identity,
                    updateAuthority: umi.identity,
                    name: nftMetadata.name,
                    symbol: nftMetadata.symbol,
                    uri: nftMetadata.uri,
                    sellerFeeBasisPoints: percentAmount(5.5),
                    tokenStandard: TokenStandard.NonFungible,
                    collection: {
                        key: collectionMint,
                        verified: false
                    }
                })
            );
            
            nfts.push({
                mint: nftMint,
                metadata: nftMetadata
            });
        }
        
        // Send transaction
        const tx = await txBuilder.sendAndConfirm(umi);
        console.log('\nNFTs created successfully!');
        const txSig = base58.deserialize(tx.signature);
        console.log(`Transaction: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
        
        // Save NFT data
        const nftData = nfts.map(nft => ({
            mint: nft.mint.publicKey.toString(),
            collection: collectionMint.toString(),
            name: nft.metadata.name,
            uri: nft.metadata.uri
        }));
        
        fs.writeFileSync(
            './nft-data.json', 
            JSON.stringify(nftData, null, 2)
        );
        
        console.log('\nNFT data saved to nft-data.json');
        
        // Wait for transaction to be fully confirmed
        console.log('\nWaiting for transaction confirmation...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify collection relationship for each NFT
        for (const nft of nfts) {
            await verifyCollection(nft.mint.publicKey);
        }
        
    } catch (error) {
        console.error('Error creating NFTs:', error);
    }
}

// Run the function to mint 3 NFTs
mintCollectionNfts(3); 