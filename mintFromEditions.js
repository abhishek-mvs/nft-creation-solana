import {
    createV1,
    mintV1,
    printV1,
    TokenStandard,
    mplTokenMetadata,
    fetchMasterEditionFromSeeds,
    createNft,
    printSupply
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


import bs58 from 'bs58';


const umi = createUmi("https://api.devnet.solana.com")
    .use(mplTokenMetadata())
    .use(mplToolbox());

// Load creator keypair
const keypairData = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));

// const base64Key = '3u2mREVwRQwTGD7fMsBF3hcdjR1mFKEYT7pqqNRBk13X3bzNvLzUhWYi3Q88tSk8XkG42LRpbpJqLg9rnFKZNfyF';
// const privateKeyArray = bs58.decode(base64Key);

const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(keypairData, 'hex'));
const collectionMintPubkey = publicKey('Es9LBrgfWdXh5SKdYoLjRmY65njWaRqNLvfan1mpUSQb')


console.log('Creator address:', keypair.publicKey.toString());
umi.use(keypairIdentity(keypair));

async function createMasterEdition(nftName, nftSymbol, nftUri) {  
  const mint = generateSigner(umi)
  console.log(`Mint: ${mint.publicKey.toString()}`);
  console.log(JSON.stringify(mint, null, 2));
  const masterNft = await createNft(umi, {
    mint,
    name: nftName,
    symbol: nftSymbol,
    uri: nftUri,
    sellerFeeBasisPoints: percentAmount(5.5),
    printSupply: printSupply('Limited', [100]), 
    creators: [
      {
        address: keypair.publicKey.toString(),
        share: 100
      }
    ],// Or printSupply('Unlimited')
    collection: {
      key: collectionMintPubkey,
      verified: false,
    }
  }).sendAndConfirm(umi)

  console.log(`Master Edition created: ${masterNft.signature}`);
  // console.log(`Master Edition: ${masterNft.result.value.metadata.uri}`);
  console.log(JSON.stringify(masterNft, null, 2));
}

createMasterEdition('Chica 3 day streak', 'Chica', 'https://gateway.irys.xyz/7hnsAu5i2Y2jWsAFGvSPsEamrt4t8NQ2hXJe6qTzYyZF')
createMasterEdition('Chica 7 day streak', 'Chica', 'https://gateway.irys.xyz/6E7CAtbffWVvHDFKV5m12iMpv4UdLaBnFsVF1EoxCgP6')
createMasterEdition('Chica 30 day streak', 'Chica', 'https://gateway.irys.xyz/5msEk4vBJbtMsfDWxBR1sJrmjS9UbWdkctnqB52aq2UR')

// const mint = publicKey('DG616NbNfVYH5Jsq5uFTcXCGZ8Fui7yMtBWfcwAYAmBS')
// const tokenOwner = publicKey('2AFVmTvpVQfjjBBRcvCsrbFjykhxLBwNXaeQsVeZcq4S')
// const masterEdition = await fetchMasterEditionFromSeeds(umi, {
//     mint: mint,
//   })
// // console.log("masterEdition", JSON.stringify(masterEdition, null, 2));
// console.log(`Master Edition: ${masterEdition.publicKey.toString()}`);
// console.log(masterEdition.supply);

// const editionsToPrint = 1
// for (let i = 0; i < editionsToPrint; i++) {
//   const editionMint = generateSigner(umi)
//   console.log(`Edition Mint: ${editionMint.publicKey.toString()}`);
//   const edition = await printV1(umi, {
//     masterTokenAccountOwner: keypair.publicKey,
//     masterEditionMint: mint,
//     editionMint,
//     editionTokenAccountOwner: tokenOwner,
//     editionNumber: masterEdition.supply + BigInt(i + 1), // make sure to increment
//     tokenStandard: TokenStandard.NonFungible,
//   }).sendAndConfirm(umi)
//   console.log(`Edition ${i + 1} created: ${edition.signature}`);
//   console.log(JSON.stringify(edition, null, 2));
// }