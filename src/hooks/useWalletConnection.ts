"use client";

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { registerOrUpdateUser } from '@/lib/user-management';
import { useUserRegistration } from './useUserRegistration';

export function useWalletConnection() {
  const { address, isConnected } = useAccount();
  const registration = useUserRegistration();

  useEffect(() => {
    if (address && isConnected) {
      const registerUser = async () => {
        const result = await registerOrUpdateUser(address);
        if (result) {
          registration.handleRegistrationComplete(result.user, result.isNewUser);
        }
      };
      registerUser();
    }
  }, [address, isConnected, registration.handleRegistrationComplete]);

  return { NameCollectionDialog: registration.NameCollectionDialog };
}
