"use client";

import { useWalletConnection } from '@/hooks/useWalletConnection';

export function WalletConnectionManager() {
  useWalletConnection();
  return null;
}
