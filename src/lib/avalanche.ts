// src/lib/avalanche.ts
import { ethers } from 'ethers';

const AVALANCHE_TESTNET_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const provider = new ethers.providers.JsonRpcProvider(AVALANCHE_TESTNET_RPC);

export async function getTransactionHistory(address: string) {
  try {
    const response = await fetch(`https://api-testnet.snowtrace.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=YOUR_SNOWTRACE_API_KEY`);
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

export async function getTokenBalances(address: string) {
  try {
    const response = await fetch(`https://api-testnet.snowtrace.io/api?module=account&action=tokenlist&address=${address}&apikey=YOUR_SNOWTRACE_API_KEY`);
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}