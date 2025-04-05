import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, percentAmount, createSignerFromKeypair, createGenericFile } from '@metaplex-foundation/umi'
import {
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata'
import { signerIdentity, keypairIdentity } from '@metaplex-foundation/umi'
import { Keypair } from '@solana/web3.js'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import fs from 'fs'
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { createV1, TokenStandard, mintV1 } from '@metaplex-foundation/mpl-token-metadata'


const umi = createUmi("https://api.devnet.solana.com")
	.use(mplTokenMetadata())
	.use(mplToolbox());


const PrivateKey = '4a6e6dcd0ef16fa545d9e450e39b2e15d7c898951acaa5ef173564b7eedba7adb753c693a08fe876cec263f4d47577a88c8ab6b1b0738311c6e52ca6eecafa1e'
const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(PrivateKey, 'hex'));
console.log('Creator address:', keypair.publicKey.toString())
// Configure UMI with wallet as signer and metadata program plugin
umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

// your SPL Token mint address
const secretKey = new Uint8Array([160,36,76,220,7,161,192,241,86,96,67,24,124,2,250,219,28,36,35,150,181,94,143,251,22,16,244,192,51,61,141,168,184,124,194,130,76,86,92,167,129,67,2,89,113,180,38,110,50,141,33,212,195,74,44,95,210,218,12,216,217,121,161,232]);
const mintKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
console.log('Mint address:', mintKeypair.publicKey.toString())

const mint = createSignerFromKeypair(umi, mintKeypair)
 
try {
    await mintV1(umi, {
        mint: mint.publicKey,
        authority: umi.identity,
        payer: umi.identity,
        updateAuthority: umi.identity,
        amount: 1,
        tokenOwner: umi.identity.publicKey,
        tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi)
} catch (error) {
    console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
    })
}