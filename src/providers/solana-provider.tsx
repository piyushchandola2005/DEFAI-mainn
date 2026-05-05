"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
	PhantomWalletAdapter,
	SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, type ReactNode } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

function resolveEndpoint(): string {
	if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
		return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
	}
	if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet") {
		return clusterApiUrl(WalletAdapterNetwork.Devnet);
	}
	return clusterApiUrl(WalletAdapterNetwork.Mainnet);
}

export function SolanaProvider({ children }: { children: ReactNode }) {
	const endpoint = useMemo(() => resolveEndpoint(), []);
	const wallets = useMemo(
		() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
		[]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
