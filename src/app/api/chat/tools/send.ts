import { PublicKey } from "@solana/web3.js";
import { tool } from "ai";
import { z } from "zod";

const pk = z.string().refine(
	(s) => {
		try {
			new PublicKey(s);
			return true;
		} catch {
			return false;
		}
	},
	{ message: "Invalid Solana address" }
);

export const send = tool({
	description:
		"Send SOL or an SPL token from the connected wallet on Solana. Always ask for confirmation before executing (use askForConfirmation). For SPL, include mint (token mint address).",
	parameters: z.object({
		to: pk.describe("Recipient Solana address (base58)."),
		amount: z.number().positive().describe("Human-readable amount to send."),
		asset: z
			.enum(["SOL", "SPL"])
			.describe("SOL for native SOL, SPL for fungible tokens."),
		mint: z
			.string()
			.optional()
			.describe("Required when asset is SPL: token mint address."),
	}),
});
