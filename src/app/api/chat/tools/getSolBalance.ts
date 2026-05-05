import { PublicKey } from "@solana/web3.js";
import { tool } from "ai";
import { z } from "zod";

export const getSolBalance = tool({
	description:
		"Get native SOL balance for the connected Solana wallet. No confirmation required.",
	parameters: z.object({}),
});

export function isValidSolanaAddress(s: string): boolean {
	try {
		new PublicKey(s);
		return true;
	} catch {
		return false;
	}
}
