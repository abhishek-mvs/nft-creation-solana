# NFT Collection with Mint Limit

This project demonstrates how to create a limited-supply NFT collection on Solana where:
- Users can mint NFTs from the collection
- There is a hard limit of 100 NFTs
- The collection keeps track of minting progress
- Users can transfer their minted NFTs to others

## Setup

1. Make sure Node.js is installed (v14+ recommended)
2. Install dependencies:
```
npm install
```

3. Generate a keypair if you don't have one:
```
node createKeyPair.js
```
This will create a `keypair.json` file with your private key.

## Creating a Collection

To create your NFT collection with a limit of 100 NFTs:

```
node createCollection.js
```

This will:
- Create a collection NFT that serves as the parent for all NFTs
- Set the maximum supply to 100
- Store collection data in `collection-data.json`

Before running, make sure to modify the collection metadata in `createCollection.js` to match your desired collection details.

## Minting NFTs from the Collection

To mint an NFT from your collection to your own wallet:

```
node mintFromCollection.js
```

To mint an NFT to another wallet address:

```
node mintFromCollection.js <RECIPIENT_WALLET_ADDRESS>
```

The script will:
- Check if the maximum supply has been reached
- Generate a new NFT as part of your collection
- Mint it to the specified recipient
- Update the supply counter

## Checking Collection Status

To check the status of your collection:

```
node checkCollectionStatus.js
```

This will display:
- Collection name and symbol
- Maximum supply
- Current supply
- Remaining mints available
- Whether the collection is sold out

## Transferring NFTs

NFTs can be transferred like any other token on Solana using standard token transfer functions. The ownership will automatically update when transferred.

## Note on Metadata

For each NFT, you'll need to provide metadata following the Metaplex standard. You can customize the `uri` field in the scripts to point to your metadata files.

Use `uploadNftMetaData.js` as a reference for uploading metadata and images to decentralized storage.

## Technical Implementation

This project uses:
- Metaplex Token Metadata program for NFT standard
- UMI for Solana interaction
- Local storage for tracking supply counts

The hard limit of 100 NFTs is enforced by the minting script, which checks and updates the supply counter in `collection-data.json` with each mint. 