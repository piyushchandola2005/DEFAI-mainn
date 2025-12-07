// src/lib/avalanche.ts
import { ethers } from 'ethers';

const AVALANCHE_TESTNET_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const provider = new ethers.providers.JsonRpcProvider(AVALANCHE_TESTNET_RPC);

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'qIl5h_vaXXZH2XzjRZN59';
const SNOWTRACE_API_KEY = process.env.NEXT_PUBLIC_SNOWTRACE_API_KEY || 'YourApiKeyToken';

export async function getTransactionHistory(address: string) {
  try {
    // Use Snowtrace API to get transaction history
    const response = await fetch(
      `https://api-testnet.snowtrace.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${SNOWTRACE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === '0') {
      console.log('No transactions found for address:', address);
      return [];
    }
    
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

export async function getTokenBalances(address: string) {
  try {
    // Get AVAX balance using Alchemy
    const response = await fetch(
      `https://api.avax-test.network/ext/bc/C/rpc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      }
    );
    const avaxData = await response.json();
    
    // Convert wei to AVAX
    const avaxBalance = (parseInt(avaxData.result || '0') / 1e18).toFixed(4);
    
    return [{
      balance: avaxBalance,
      contractAddress: '0x0000000000000000000000000000000000000000',
      decimals: '18',
      name: 'Avalanche',
      symbol: 'AVAX',
      type: 'Native'
    }];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}