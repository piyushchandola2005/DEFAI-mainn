import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getRpcEndpoint } from "./solana-config";

type ExplorerTx = {
	hash: string;
	from: string;
	to: string;
	value: string;
	timeStamp: string;
	isError: string;
	gasUsed: string;
	gasPrice: string;
	tokenSymbol?: string;
};

type TokenRow = {
	symbol: string;
	name: string;
	balance: string;
	logo?: string;
	address: string;
	valueUsd?: number;
	decimals: string;
};

function getConnection(): Connection {
	return new Connection(getRpcEndpoint(), "confirmed");
}

export async function getTransactionHistory(address: string): Promise<ExplorerTx[]> {
	try {
		const connection = getConnection();
		const pub = new PublicKey(address);
		const sigs = await connection.getSignaturesForAddress(pub, { limit: 25 });
		return sigs.map((s) => ({
			hash: s.signature,
			from: address,
			to: "",
			value: "0",
			timeStamp: s.blockTime != null ? String(s.blockTime) : "0",
			isError: s.err ? "1" : "0",
			gasUsed: "",
			gasPrice: "",
			tokenSymbol: "SOL",
		}));
	} catch (e) {
		console.error("getTransactionHistory", e);
		return [];
	}
}

export async function getTokenBalances(address: string): Promise<TokenRow[]> {
	const connection = getConnection();
	const pub = new PublicKey(address);
	const out: TokenRow[] = [];

	try {
		const lamports = await connection.getBalance(pub);
		const sol = (lamports / LAMPORTS_PER_SOL).toFixed(6);
		out.push({
			symbol: "SOL",
			name: "Solana",
			balance: sol,
			address: "native",
			decimals: "9",
		});
	} catch (e) {
		console.error("native balance", e);
	}

	try {
		const accounts = await connection.getParsedTokenAccountsByOwner(pub, {
			programId: TOKEN_PROGRAM_ID,
		});
		for (const { pubkey, account } of accounts.value) {
			const pdata = account.data;
			if (
				!pdata ||
				typeof pdata !== "object" ||
				!("parsed" in pdata) ||
				!pdata.parsed ||
				typeof pdata.parsed !== "object" ||
				!("info" in pdata.parsed)
			) {
				continue;
			}
			const info = (
				pdata.parsed as {
					info: {
						mint: string;
						tokenAmount: {
							amount: string;
							decimals: number;
							uiAmount: number | null;
						};
					};
				}
			).info;
			if (!info?.tokenAmount) continue;
			const amount = info.tokenAmount.uiAmount;
			const decimals = info.tokenAmount.decimals;
			const mint = info.mint;
			out.push({
				symbol: mint.slice(0, 4) + "…",
				name: "SPL Token",
				balance:
					amount != null
						? String(amount)
						: (
								Number(info.tokenAmount.amount) /
								10 ** decimals
						  ).toString(),
				address: pubkey.toBase58(),
				decimals: String(decimals),
			});
		}
	} catch (e) {
		console.error("token accounts", e);
	}

	return out;
}
