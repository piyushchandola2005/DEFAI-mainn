"use client";

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import { registerOrUpdateUser } from '@/lib/user-management';

export function useWalletConnection() {
  const { address, isConnected, isConnecting } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      // Register or update user when wallet connects
      registerOrUpdateUser(address)
        .then((user) => {
          if (user) {
            console.log('User registered/updated:', user);
            toast.success('Wallet connected successfully!');
          } else {
            toast.error('Failed to register user');
          }
        })
        .catch((error) => {
          console.error('Error registering user:', error);
          toast.error('Error connecting wallet');
        });
    }
  }, [isConnected, address]);

  return {
    address,
    isConnected,
    isConnecting
  };
}
