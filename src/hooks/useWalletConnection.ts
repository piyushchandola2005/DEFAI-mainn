"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { registerOrUpdateUser } from "@/lib/user-management";
import { useUserRegistration } from "./useUserRegistration";

export function useWalletConnection() {
	const { publicKey, connected } = useWallet();
	const { handleRegistrationComplete, NameCollectionDialog } = useUserRegistration();

	useEffect(() => {
		const addr = publicKey?.toBase58();
		if (addr && connected) {
			const registerUser = async () => {
				const result = await registerOrUpdateUser(addr);
				if (result) {
					handleRegistrationComplete(result.user, result.isNewUser);
				}
			};
			registerUser();
		}
	}, [publicKey, connected, handleRegistrationComplete]);

	return { NameCollectionDialog };
}
