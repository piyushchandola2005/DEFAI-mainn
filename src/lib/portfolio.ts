// src/lib/portfolio.ts
import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { erc20Abi } from 'viem';

const client = createPublicClient({
  chain: avalancheFuji,
  transport: http(`https://avalanche-fuji.g.alchemy.com/v2/qIl5h_vaXXZH2XzjRZN59`),
});

// Avalanche Fuji testnet token contracts
const TOKEN_CONTRACTS = {
  USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC.e on Avalanche Fuji
  USDT: '0x5427FEFA711598051b44060F05728C25eEcF12c2', // USDT.e on Avalanche Fuji
  DAI: '0x1AE7AeeB1170686B310B0480608bB5a25A6Bb656', // DAI.e on Avalanche Fuji
  WETH: '0xd009A4C7B0DdF7d0c5B5e68B5C2913879a1d86Ab', // Wrapped AVAX
  AVAX: '0x0000000000000000000000000000000000000000', // Native AVAX
};

export async function getPortfolioData(address: string) {
  try {
    console.log('Fetching real portfolio data for:', address);
    
    // Get AVAX balance
    const avaxBalance = await client.getBalance({ address: address as `0x${string}` });
    const avaxBalanceFormatted = formatEther(avaxBalance);
    
    // Get token balances
    const tokens = [];
    for (const [symbol, contract] of Object.entries(TOKEN_CONTRACTS)) {
      // Skip AVAX as it's the native token
      if (symbol === 'AVAX') continue;
      
      try {
        const balance = await client.readContract({
          address: contract as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        });
        
        if (balance > 0) {
          tokens.push({
            symbol,
            name: getTokenName(symbol),
            balance: formatUnits(balance, getTokenDecimals(symbol)),
            logo: getTokenLogo(symbol),
          });
        }
      } catch (error) {
        console.log(`Failed to fetch ${symbol} balance:`, error);
      }
    }
    
    // Get NFTs (simplified - you'd use Alchemy NFT API for this)
    const nfts = await getNFTs(address);
    
    return {
      balanceEth: avaxBalanceFormatted, // Keep as balanceEth for compatibility
      tokens,
      nfts,
    };
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    throw error;
  }
}

function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  const remainderStr = remainder.toString().padStart(decimals, '0');
  return `${quotient}.${remainderStr.slice(0, 6)}`;
}

function getTokenName(symbol: string): string {
  const names: Record<string, string> = {
    USDC: 'USD Coin',
    USDT: 'Tether',
    DAI: 'Dai Stablecoin',
    WETH: 'Wrapped AVAX',
    AVAX: 'Avalanche',
  };
  return names[symbol] || symbol;
}

function getTokenDecimals(symbol: string): number {
  const decimals: Record<string, number> = {
    USDC: 6,
    USDT: 6,
    DAI: 18,
    WETH: 18,
    AVAX: 18,
  };
  return decimals[symbol] || 18;
}

function getTokenLogo(symbol: string): string {
  const logos: Record<string, string> = {
    USDC: '/usdc-logo.png',
    USDT: '/usdt-logo.png',
    DAI: '/dai-logo.png',
    WETH: '/avax-logo.png',
    AVAX: '/avax-logo.png',
  };
  return logos[symbol] || '/default-token.png';
}

async function getNFTs(address: string) {
  // Simplified NFT fetching - you'd use Alchemy NFT API here
  // For now, return empty array
  return [];
}
