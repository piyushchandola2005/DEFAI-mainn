import { Buffer } from "buffer";
import { VersionedTransaction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

const JUP_QUOTE = "https://quote-api.jup.ag/v6/quote";
const JUP_SWAP = "https://quote-api.jup.ag/v6/swap";

export async function jupiterSwap(params: {
	connection: Connection;
	wallet: WalletContextState;
	inputMint: string;
	outputMint: string;
	amountRaw: string;
	slippageBps?: number;
}): Promise<{ signature: string }> {
	const { connection, wallet, inputMint, outputMint, amountRaw, slippageBps = 100 } = params;
	const { publicKey, signTransaction } = wallet;
	if (!publicKey || !signTransaction) {
		throw new Error("Wallet not connected");
	}

	const quoteUrl = new URL(JUP_QUOTE);
	quoteUrl.searchParams.set("inputMint", inputMint);
	quoteUrl.searchParams.set("outputMint", outputMint);
	quoteUrl.searchParams.set("amount", amountRaw);
	quoteUrl.searchParams.set("slippageBps", String(slippageBps));

	const quoteRes = await fetch(quoteUrl.toString());
	if (!quoteRes.ok) {
		const t = await quoteRes.text();
		throw new Error(`Jupiter quote failed: ${t}`);
	}
	const quote = await quoteRes.json();

	const swapRes = await fetch(JUP_SWAP, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			quoteResponse: quote,
			userPublicKey: publicKey.toBase58(),
			wrapAndUnwrapSol: true,
			dynamicComputeUnitLimit: true,
			prioritizationFeeLamports: "auto",
		}),
	});
	if (!swapRes.ok) {
		const t = await swapRes.text();
		throw new Error(`Jupiter swap build failed: ${t}`);
	}
	const swapJson = await swapRes.json();
	const swapTransaction = swapJson.swapTransaction as string;
	if (!swapTransaction) {
		throw new Error("No swapTransaction from Jupiter");
	}

	const vtx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));
	const signed = await signTransaction(vtx);
	const sig = await connection.sendRawTransaction(signed.serialize(), {
		skipPreflight: false,
		maxRetries: 3,
	});

	const latest = await connection.getLatestBlockhash();
	await connection.confirmTransaction(
		{ signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
		"confirmed"
	);

	return { signature: sig };
}
