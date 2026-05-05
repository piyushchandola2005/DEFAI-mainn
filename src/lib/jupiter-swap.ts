import { Buffer } from "buffer";
import { VersionedTransaction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

const JUP_ENDPOINTS = [
	{
		quote: "https://lite-api.jup.ag/swap/v1/quote",
		swap: "https://lite-api.jup.ag/swap/v1/swap",
	},
	{
		quote: "https://quote-api.jup.ag/v6/quote",
		swap: "https://quote-api.jup.ag/v6/swap",
	},
];

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

	let swapJson: any | null = null;
	let lastError = "";
	const authHeaders: Record<string, string> = {};
	if (JUPITER_API_KEY) {
		authHeaders["x-api-key"] = JUPITER_API_KEY;
		authHeaders["Authorization"] = `Bearer ${JUPITER_API_KEY}`;
	}

	for (const endpoint of JUP_ENDPOINTS) {
		try {
			const quoteUrl = new URL(endpoint.quote);
			quoteUrl.searchParams.set("inputMint", inputMint);
			quoteUrl.searchParams.set("outputMint", outputMint);
			quoteUrl.searchParams.set("amount", amountRaw);
			quoteUrl.searchParams.set("slippageBps", String(slippageBps));

			const quoteRes = await fetch(quoteUrl.toString(), {
				headers: authHeaders,
			});
			if (!quoteRes.ok) {
				const t = await quoteRes.text();
				throw new Error(`quote failed (${endpoint.quote}): ${t}`);
			}
			const quote = await quoteRes.json();

			const swapRes = await fetch(endpoint.swap, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...authHeaders,
				},
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
				throw new Error(`swap build failed (${endpoint.swap}): ${t}`);
			}
			swapJson = await swapRes.json();
			break;
		} catch (error) {
			lastError =
				error instanceof Error ? error.message : "Unknown Jupiter API error";
		}
	}

	if (!swapJson) {
		throw new Error(
			`Jupiter API unavailable or no route for this amount/pair. ${lastError}`
		);
	}

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
