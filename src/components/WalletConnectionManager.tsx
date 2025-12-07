"use client";

import { useWalletConnection } from '@/hooks/useWalletConnection';

export function WalletConnectionManager() {
  const { NameCollectionDialog } = useWalletConnection();
  
  return <NameCollectionDialog />;
}
