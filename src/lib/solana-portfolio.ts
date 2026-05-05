import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
} from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getRpcEndpoint } from "./solana-config";

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";
export const SOL_LOGO =
	"https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png";

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

async function fetchBirdEyeTokenOverview(mint: string): Promise<{
	symbol?: string;
	name?: string;
	logoURI?: string;
	price?: number;
} | null> {
	if (!BIRDEYE_API_KEY) return null;
	try {
		const res = await fetch(
			`${BIRDEYE_BASE_URL}/defi/token_overview?address=${mint}`,
			{
				headers: {
					accept: "application/json",
					"X-API-KEY": BIRDEYE_API_KEY,
					"x-chain": "solana",
				},
			}
		);
		if (!res.ok) return null;
		const body = await res.json();
		const data = body?.data;
		if (!data) return null;
		let price: number | undefined =
			typeof data.price === "number"
				? data.price
				: typeof data.priceUsd === "number"
				? data.priceUsd
				: undefined;

		// Fallback: dedicated price endpoint for tokens where overview omits price.
		if (price == null) {
			const priceRes = await fetch(
				`${BIRDEYE_BASE_URL}/defi/price?address=${mint}`,
				{
					headers: {
						accept: "application/json",
						"X-API-KEY": BIRDEYE_API_KEY,
						"x-chain": "solana",
					},
				}
			);
			if (priceRes.ok) {
				const priceBody = await priceRes.json();
				const priceData = priceBody?.data;
				if (typeof priceData?.value === "number") {
					price = priceData.value;
				}
			}
		}

		return {
			symbol: data.symbol,
			name: data.name,
			logoURI: data.logoURI,
			price,
		};
	} catch {
		return null;
	}
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
			logo: SOL_LOGO,
		});
	} catch (e) {
		console.error("native balance", e);
	}

	try {
		const [tokenAccountsLegacy, tokenAccounts2022] = await Promise.all([
			connection.getParsedTokenAccountsByOwner(pub, {
				programId: TOKEN_PROGRAM_ID,
			}),
			connection.getParsedTokenAccountsByOwner(pub, {
				programId: TOKEN_2022_PROGRAM_ID,
			}),
		]);
		const allAccounts = [
			...tokenAccountsLegacy.value,
			...tokenAccounts2022.value,
		];
		const rows: Array<{
			pubkey: string;
			mint: string;
			decimals: number;
			balance: string;
		}> = [];
		for (const { pubkey, account } of allAccounts) {
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
			const uiBalance =
				amount != null
					? String(amount)
					: (
							Number(info.tokenAmount.amount) /
							10 ** decimals
					  ).toString();
			if (Number(uiBalance || "0") <= 0) continue;
			rows.push({
				pubkey: pubkey.toBase58(),
				mint,
				decimals,
				balance: uiBalance,
			});
		}

		const topRows = rows.slice(0, 20);
		const overviews = await Promise.all(
			topRows.map((r) => fetchBirdEyeTokenOverview(r.mint))
		);

		for (let i = 0; i < topRows.length; i += 1) {
			const row = topRows[i];
			const overview = overviews[i];
			out.push({
				symbol: overview?.symbol || row.mint.slice(0, 4) + "…",
				name: overview?.name || "SPL Token",
				balance:
					row.balance,
				address: row.pubkey,
				decimals: String(row.decimals),
				logo: overview?.logoURI,
				valueUsd:
					overview?.price && Number(row.balance)
						? Number(row.balance) * overview.price
						: undefined,
			});
		}
	} catch (e) {
		console.error("token accounts", e);
	}

	return out;
}
