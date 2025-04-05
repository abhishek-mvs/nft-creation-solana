import fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

// Initialize UMI
const umi = createUmi('https://api.devnet.solana.com')
    .use(mplTokenMetadata());

// Function to check collection status
async function checkCollectionStatus() {
    try {
        // Load collection data
        const collectionData = JSON.parse(fs.readFileSync('./collection-data.json', 'utf8'));
        
        // Get collection public key
        const collectionMintPubkey = publicKey(collectionData.mint);
        
        // Fetch the collection NFT data from the blockchain
        console.log('Fetching collection data from blockchain...');
        const collectionNft = await fetchDigitalAsset(umi, collectionMintPubkey);
        
        // Prepare status information
        const status = {
            collectionName: collectionNft.metadata.name,
            collectionSymbol: collectionNft.metadata.symbol,
            collectionUri: collectionNft.metadata.uri,
            maxSupply: collectionData.maxSupply,
            currentSupply: collectionData.currentSupply,
            remainingMints: collectionData.maxSupply - collectionData.currentSupply,
            isSoldOut: collectionData.currentSupply >= collectionData.maxSupply,
            collectionAddress: collectionMintPubkey.toString(),
            updateAuthority: collectionNft.metadata.updateAuthority.toString(),
        };
        
        console.log('Collection Status:');
        console.log('==================');
        console.log(`Name: ${status.collectionName}`);
        console.log(`Symbol: ${status.collectionSymbol}`);
        console.log(`Total Supply: ${status.maxSupply}`);
        console.log(`Minted: ${status.currentSupply}`);
        console.log(`Available: ${status.remainingMints}`);
        console.log(`Sold Out: ${status.isSoldOut ? 'Yes' : 'No'}`);
        console.log(`Collection Address: ${status.collectionAddress}`);
        console.log(`Update Authority: ${status.updateAuthority}`);
        
        return status;
    } catch (error) {
        console.error('Error checking collection status:', error);
        
        if (error.message && error.message.includes('collection-data.json')) {
            console.error('Collection data file not found. Have you created a collection first?');
            console.error('Run "node createCollection.js" to create a collection.');
        }
        
        return null;
    }
}

// Run the function
checkCollectionStatus();

// Export for use in other modules
export { checkCollectionStatus }; 