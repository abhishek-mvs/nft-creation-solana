import {
    createV1,
    mintV1,
    TokenStandard,
    findMetadataPda
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
    generateSigner,
    percentAmount,
    publicKey
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';

// This file would be used in a web application, not run directly with Node.js

// Collection configuration - this would normally be loaded from your database or a config file
const COLLECTION_CONFIG = {
    mint: "YOUR_COLLECTION_MINT_ADDRESS", // Replace with your collection mint address
    maxSupply: 100,
    price: 0.1, // SOL
    name: "My Collection",
    symbol: "MLC",
    baseUri: "https://your-metadata-uri.com/nft", // Base URI for metadata
};

// MintNFT Component
function MintNFT() {
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [currentSupply, setCurrentSupply] = useState(0);
    const [error, setError] = useState(null);
    const [mintedNft, setMintedNft] = useState(null);

    // Initialize UMI with the user's wallet
    const umi = useMemo(() => {
        const umi = createUmi("https://api.devnet.solana.com")
            .use(mplTokenMetadata())
            .use(mplToolbox());

        // Only set the identity if wallet is connected
        if (wallet.connected) {
            umi.use(walletAdapterIdentity(wallet));
        }
        
        return umi;
    }, [wallet.connected]);

    // Fetch current supply (in a real app, you'd fetch this from an API or on-chain)
    useEffect(() => {
        const fetchSupply = async () => {
            // This is simplified - in a real app, you'd query on-chain for the current supply
            // or use an indexing service like Helius/Flipside/etc.
            setCurrentSupply(20); // Example value
        };

        if (wallet.connected) {
            fetchSupply();
        }
    }, [wallet.connected]);

    const mintNft = async () => {
        if (!wallet.connected) {
            setError("Please connect your wallet first");
            return;
        }
        
        if (currentSupply >= COLLECTION_CONFIG.maxSupply) {
            setError("Collection is sold out");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Generate a new mint for this NFT
            const nftMint = generateSigner(umi);
            console.log('New NFT Mint Address:', nftMint.publicKey.toString());
            
            // NFT Metadata
            const tokenNumber = currentSupply + 1;
            const nftMetadata = {
                name: `${COLLECTION_CONFIG.name} #${tokenNumber}`,
                symbol: COLLECTION_CONFIG.symbol,
                uri: `${COLLECTION_CONFIG.baseUri}${tokenNumber}.json`,
            };

            // Create the NFT that belongs to the collection
            console.log('Creating new NFT...');
            
            const collectionMintPubkey = publicKey(COLLECTION_CONFIG.mint);
            
            const createTx = await createV1(umi, {
                mint: nftMint,
                authority: umi.identity,
                payer: umi.identity,
                updateAuthority: umi.identity,
                name: nftMetadata.name,
                symbol: nftMetadata.symbol,
                uri: nftMetadata.uri,
                sellerFeeBasisPoints: percentAmount(5.5), // 5.5% royalty
                tokenStandard: TokenStandard.NonFungible,
                collection: {
                    key: collectionMintPubkey,
                    verified: false, // The collection verification would be done separately
                },
            }).sendAndConfirm(umi);
            
            console.log('NFT created, now minting to user wallet...');
            
            // Mint the token to the user's wallet
            const mintTx = await mintV1(umi, {
                mint: nftMint.publicKey,
                authority: umi.identity,
                payer: umi.identity,
                amount: 1, // NFTs have amount 1
                tokenOwner: umi.identity.publicKey, // The user's wallet
                tokenStandard: TokenStandard.NonFungible,
            }).sendAndConfirm(umi);
            
            setMintedNft({
                mint: nftMint.publicKey.toString(),
                owner: umi.identity.publicKey.toString(),
                name: nftMetadata.name
            });
            
            // Update UI to show new supply
            setCurrentSupply(prevSupply => prevSupply + 1);
            
        } catch (error) {
            console.error('Error minting NFT:', error);
            setError(error.message || "Failed to mint NFT");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mint-container">
            <h1>{COLLECTION_CONFIG.name}</h1>
            <p>Current Supply: {currentSupply} / {COLLECTION_CONFIG.maxSupply}</p>
            <p>Price: {COLLECTION_CONFIG.price} SOL</p>
            
            {!wallet.connected ? (
                <button onClick={wallet.connect}>Connect Wallet</button>
            ) : (
                <button 
                    onClick={mintNft} 
                    disabled={isLoading || currentSupply >= COLLECTION_CONFIG.maxSupply}
                >
                    {isLoading ? "Minting..." : "Mint NFT"}
                </button>
            )}
            
            {error && <p className="error">{error}</p>}
            
            {mintedNft && (
                <div className="success">
                    <h3>Successfully minted!</h3>
                    <p>NFT: {mintedNft.name}</p>
                    <p>Mint Address: {mintedNft.mint}</p>
                    <p>Owner: {mintedNft.owner}</p>
                </div>
            )}
        </div>
    );
}

// App Component with Wallet Providers
function App() {
    // Set up the wallet providers - you'll need the wallet adapters you want to support
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint="https://api.devnet.solana.com">
            <WalletProvider wallets={wallets} autoConnect>
                <MintNFT />
            </WalletProvider>
        </ConnectionProvider>
    );
}

// Render the App
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// Note: This file is meant to be used in a React web application
// You would need to build it with tools like webpack/vite and serve it via a static hosting service
// For actual deployment, you would want to add:
// 1. Error handling and better UX
// 2. On-chain verification for collection items
// 3. Proper state management for supply tracking
// 4. Payment handling for minting costs 