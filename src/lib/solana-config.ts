import { clusterApiUrl, Cluster } from "@solana/web3.js";

const WSOL_MAINNET = "So11111111111111111111111111111111111111112";
const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function getRpcEndpoint(): string {
	if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
		return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
	}
	return process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
		? clusterApiUrl("devnet")
		: clusterApiUrl("mainnet-beta");
}

export function getCluster(): Cluster {
	return process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet-beta";
}

export function getTxExplorerUrl(signature: string): string {
	const base =
		getCluster() === "devnet"
			? "https://solscan.io/tx/"
			: "https://solscan.io/tx/";
	return `${base}${signature}${getCluster() === "devnet" ? "?cluster=devnet" : ""}`;
}

export function getAddressExplorerUrl(address: string): string {
	const q = getCluster() === "devnet" ? "?cluster=devnet" : "";
	return `https://solscan.io/account/${address}${q}`;
}

export { WSOL_MAINNET, USDC_MAINNET };
