/**
 * Well-known Solana mainnet mints for AI hints and UI labels.
 * Always prefer explicit mints from the user for memecoins.
 */
export const KNOWN_MINTS: Record<string, string> = {
	SOL: "So11111111111111111111111111111111111111112",
	WSOL: "So11111111111111111111111111111111111111112",
	USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
};

export function resolveMintSymbolOrAddress(input: string): string {
	const k = input.trim().toUpperCase();
	if (KNOWN_MINTS[k]) return KNOWN_MINTS[k];
	return input.trim();
}
