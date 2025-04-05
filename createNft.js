import {
	createV1,
	findMetadataPda,
	mplTokenMetadata,
	TokenStandard
} from "@metaplex-foundation/mpl-token-metadata";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  sol,
  createGenericFile,
  createSignerFromKeypair,
  keypairIdentity
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Keypair } from '@solana/web3.js'

const umi = createUmi("https://api.devnet.solana.com")
	.use(mplTokenMetadata())
	.use(mplToolbox());

// Generate a new keypair signer.


const PrivateKey = '4a6e6dcd0ef16fa545d9e450e39b2e15d7c898951acaa5ef173564b7eedba7adb753c693a08fe876cec263f4d47577a88c8ab6b1b0738311c6e52ca6eecafa1e'


const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(PrivateKey, 'hex'));
console.log('Creator address:', keypair.publicKey.toString())
// Configure UMI with wallet as signer and metadata program plugin
umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

// your SPL Token mint address
const mint = generateSigner(umi)
 

// Sample Metadata for our Token
const tokenMetadata = {
	name: "Sleepy Chica",
	symbol: "Chica!!",
	uri: "https://gateway.irys.xyz/3dkWXbG9yELSZFQEFWMU4epuEMzkDTr9jkRGKQ3s6TYZ",
};

// Add metadata to an existing SPL token wrapper function
async function addMetadata() {
	// Airdrop 2 SOL to the identity
    // if you end up with a 429 too many requests error, you may have to use
    // the a different rpc other than the free default one supplied.
    console.log('mint.publicKey.toString()', mint.publicKey.toString())
    console.log('mint', mint.secretKey.toString())

    // derive the metadata account that will store our metadata data onchain
	const metadataAccountAddress = await findMetadataPda(umi, {
		mint: mint,
	});

	const tx = await createV1(umi, {
		mint,
		authority: umi.identity,
		payer: umi.identity,
		updateAuthority: umi.identity,
		name: tokenMetadata.name,
		symbol: tokenMetadata.symbol,
		uri: tokenMetadata.uri,
		sellerFeeBasisPoints: percentAmount(5.5), // 5.5%
		tokenStandard: TokenStandard.NonFungible,
	}).sendAndConfirm(umi);
    console.log('tx', JSON.stringify(tx, null, 2))
    console.log('tx.signature', tx.signature.toString())
	let txSig = base58.deserialize(tx.signature);
	console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
}

// run the function
addMetadata();