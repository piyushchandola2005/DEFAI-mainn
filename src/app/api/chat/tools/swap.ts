import { PublicKey } from "@solana/web3.js";
import { tool } from "ai";
import { z } from "zod";

const mint = z.string().refine(
	(s) => {
		try {
			new PublicKey(s);
			return true;
		} catch {
			return false;
		}
	},
	{ message: "Invalid mint address" }
);

export const swap = tool({
	description:
		"Swap tokens on Solana via Jupiter. Requires input and output mint addresses (base58). For memecoins the user must confirm mints—never guess. Ask for confirmation before executing. Amount is in human units of the INPUT token.",
	parameters: z.object({
		inputMint: mint.describe("Input token mint (base58). Use WSOL mint for SOL."),
		outputMint: mint.describe("Output token mint (base58)."),
		amount: z
			.number()
			.positive()
			.describe("Amount of INPUT token to swap (human-readable, not lamports)."),
		slippageBps: z
			.number()
			.min(10)
			.max(5000)
			.optional()
			.describe("Slippage in basis points (100 = 1%). Default 100."),
	}),
});
