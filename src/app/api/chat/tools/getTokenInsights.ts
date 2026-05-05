import { PublicKey } from "@solana/web3.js";
import { tool } from "ai";
import { z } from "zod";

const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

async function birdeyeGet(path: string, address: string) {
	const res = await fetch(`${BIRDEYE_BASE_URL}${path}?address=${address}`, {
		method: "GET",
		headers: {
			accept: "application/json",
			"X-API-KEY": BIRDEYE_API_KEY || "",
			"x-chain": "solana",
		},
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Birdeye request failed (${res.status}): ${body}`);
	}
	return res.json();
}

export const getTokenInsights = tool({
	description:
		"Fetch BirdEye token details for a Solana contract address (mint). Use this when the user sends a CA/mint and asks for token info, health, or quick analysis.",
	parameters: z.object({
		contractAddress: z
			.string()
			.describe("Solana token mint/contract address (base58)."),
	}),
	execute: async ({ contractAddress }) => {
		try {
			new PublicKey(contractAddress);
		} catch {
			return JSON.stringify({
				error: "Invalid Solana contract/mint address.",
				contractAddress,
			});
		}

		if (!BIRDEYE_API_KEY) {
			return JSON.stringify({
				error: "BIRDEYE_API_KEY is not set.",
				contractAddress,
			});
		}

		try {
			const [overview, price, security] = await Promise.allSettled([
				birdeyeGet("/defi/token_overview", contractAddress),
				birdeyeGet("/defi/price", contractAddress),
				birdeyeGet("/defi/token_security", contractAddress),
			]);

			const getValue = (item: PromiseSettledResult<any>) =>
				item.status === "fulfilled" ? item.value?.data ?? item.value : null;

			return JSON.stringify({
				contractAddress,
				source: "BirdEye",
				overview: getValue(overview),
				price: getValue(price),
				security: getValue(security),
			});
		} catch (error) {
			return JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch BirdEye token insights.",
				contractAddress,
			});
		}
	},
});
