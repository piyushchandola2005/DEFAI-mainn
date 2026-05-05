import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	createAssociatedTokenAccountInstruction,
	createTransferCheckedInstruction,
	getAccount,
	getAssociatedTokenAddress,
	getMint,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export async function transferSol(params: {
	connection: Connection;
	wallet: WalletContextState;
	to: string;
	amountSol: number;
}): Promise<string> {
	const { connection, wallet, to, amountSol } = params;
	const { publicKey, sendTransaction } = wallet;
	if (!publicKey || !sendTransaction) throw new Error("Wallet not connected");

	const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
	const toPub = new PublicKey(to);
	const tx = new Transaction().add(
		SystemProgram.transfer({
			fromPubkey: publicKey,
			toPubkey: toPub,
			lamports,
		})
	);

	const { blockhash, lastValidBlockHeight } =
		await connection.getLatestBlockhash();
	tx.recentBlockhash = blockhash;
	tx.feePayer = publicKey;

	const sig = await sendTransaction(tx, connection, {
		skipPreflight: false,
	});

	await connection.confirmTransaction(
		{ signature: sig, blockhash, lastValidBlockHeight },
		"confirmed"
	);
	return sig;
}

export async function transferSplToken(params: {
	connection: Connection;
	wallet: WalletContextState;
	mint: string;
	to: string;
	amountHuman: number;
}): Promise<string> {
	const { connection, wallet, mint, to, amountHuman } = params;
	const { publicKey, sendTransaction } = wallet;
	if (!publicKey || !sendTransaction) throw new Error("Wallet not connected");

	const mintPk = new PublicKey(mint);
	const toPk = new PublicKey(to);
	const mintInfo = await getMint(connection, mintPk);
	const decimals = mintInfo.decimals;

	const fromAta = await getAssociatedTokenAddress(mintPk, publicKey);
	const toAta = await getAssociatedTokenAddress(mintPk, toPk);

	const raw = BigInt(
		Math.round(amountHuman * Math.pow(10, decimals))
	);

	const ix = [];
	let needCreateToAta = false;
	try {
		await getAccount(connection, toAta);
	} catch {
		needCreateToAta = true;
	}
	if (needCreateToAta) {
		ix.push(
			createAssociatedTokenAccountInstruction(
				publicKey,
				toAta,
				toPk,
				mintPk
			)
		);
	}
	ix.push(
		createTransferCheckedInstruction(
			fromAta,
			mintPk,
			toAta,
			publicKey,
			raw,
			decimals,
			[],
			TOKEN_PROGRAM_ID
		)
	);

	const tx = new Transaction().add(...ix);
	const { blockhash, lastValidBlockHeight } =
		await connection.getLatestBlockhash();
	tx.recentBlockhash = blockhash;
	tx.feePayer = publicKey;

	const sig = await sendTransaction(tx, connection);
	await connection.confirmTransaction(
		{ signature: sig, blockhash, lastValidBlockHeight },
		"confirmed"
	);
	return sig;
}
