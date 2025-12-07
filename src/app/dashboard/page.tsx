"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from "@/lib/supabase";
import { getTransactionHistory, getTokenBalances } from "@/lib/avalanche";
import { GlowCard } from "@/components/ui/glow-card";
import { 
  TrendingUp, 
  Wallet, 
  Layers, 
  ArrowUpRight, 
  Activity, 
  PieChart,
  RefreshCw,
  ShieldCheck,
  Clock,
  ArrowDownLeft,
  ArrowUpDown,
  XCircle
} from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

// Types
type Token = {
  symbol: string;
  name: string;
  balance: string;
  logo?: string;
  address: string;
  valueUsd?: number;
  tokenDecimal?: string;
};

type Transaction = {
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

type PortfolioData = {
  balanceAvax: string;
  transactions: Transaction[];
  tokens: Token[];
  aiUsage: {
    totalCalls: number;
    lastUsed: string | null;
    favoriteTools: string[];
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format token value with decimals
  const formatTokenValue = (value?: string | number, decimals: string | number = '18') => {
    try {
      if (!value) return '0';
      const strValue = value.toString();
      if (!strValue) return '0';
      
      const decimalNumber = parseInt(decimals.toString());
      const parsedValue = parseFloat(strValue);
      
      if (isNaN(parsedValue)) return '0';
      
      const formatted = (parsedValue / Math.pow(10, decimalNumber)).toFixed(4);
      return parseFloat(formatted).toString();
    } catch (error) {
      console.error('Error formatting token value:', error);
      return '0';
    }
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - parseInt(timestamp) * 1000) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  };

  // Format address to show first and last 4 characters
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Load portfolio data
  const loadPortfolioData = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Get transaction history from Avalanche testnet
      const transactions = await getTransactionHistory(address);
      
      // Get token balances from Avalanche testnet
      const tokenBalances = await getTokenBalances(address);
      
      // Get AI usage from database
      const { data: usageData } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_address', address.toLowerCase())
        .single();

          // Get AVAX balance from token balances
      const avaxBalance = Array.isArray(tokenBalances) 
        ? tokenBalances.find(t => t.symbol === 'AVAX')?.balance || '0'
        : '0';

      // Ensure we're working with arrays and handle potential undefined/null cases
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const safeTokenBalances = Array.isArray(tokenBalances) ? tokenBalances : [];
      
      setData({
        balanceAvax: avaxBalance,
        transactions: safeTransactions,
        tokens: safeTokenBalances,
        aiUsage: usageData || {
          totalCalls: 0,
          lastUsed: null,
          favoriteTools: []
        }
      });
      
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [address]);

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    loadPortfolioData();
  };

  // Load data on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      loadPortfolioData();
    }
  }, [isConnected, address, loadPortfolioData]);

  // --- Render States ---

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <GlowCard className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-zinc-400">Access your personalized AI DeFi dashboard.</p>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-8 space-y-8">
      {/* --- Header Section --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Avalanche Dashboard
          </h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {isConnected ? 'Connected to Avalanche Fuji Testnet' : 'Disconnected'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2 backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-500 to-orange-500" />
          <span className="font-mono text-sm text-zinc-300">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          </span>
        </div>
      </header>

      {/* --- Key Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AVAX Balance Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AVAX Balance</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {loading ? "..." : `${data?.balanceAvax || "0.00"} AVAX`}
          </div>
          <div className="text-sm text-zinc-400">
            Testnet funds · no USD value
          </div>
        </GlowCard>

        {/* Assets Count Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Token Holdings</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {loading ? "..." : data?.tokens?.length || 0}
          </div>
          <p className="text-sm text-zinc-500">Tokens in your wallet</p>
        </GlowCard>

        {/* Transaction Count Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Transactions</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {loading ? "..." : data?.transactions?.length || 0}
          </div>
          <p className="text-sm text-zinc-500">Total on-chain transactions</p>
        </GlowCard>
      </div>

      {/* --- Main Content Split --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Token Holdings (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Token Holdings
            </h2>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {/* AVAX Balance */}
            <GlowCard className="p-0 border-0 bg-transparent hover:bg-zinc-900/30">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-500 to-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Avalanche</h3>
                    <div className="text-xs text-zinc-400">AVAX</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium">{data?.balanceAvax || '0.00'} AVAX</div>
                  <div className="text-xs text-zinc-500">
                    Testnet funds · no USD value
                  </div>
                </div>
              </div>
            </GlowCard>

            {/* Other Tokens */}
            {data?.tokens?.map((token, i) => (
              <GlowCard key={i} className="p-0 border-0 bg-transparent hover:bg-zinc-900/30">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800">
                      {token.logo ? (
                        <Image 
                          src={token.logo}
                          alt={token.symbol}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.token-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-400 token-fallback ${token.logo ? 'hidden' : ''}`}>
                        {token.symbol?.substring(0, 3) || 'TOK'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{token.name || 'Unknown Token'}</h3>
                      <div className="text-xs text-zinc-400">{token.symbol || 'TOKEN'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {token.balance ? formatTokenValue(token.balance, token.tokenDecimal) : '0.00'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {token.valueUsd ? `≈ $${token.valueUsd.toFixed(2)}` : 'Price unavailable'}
                    </div>
                  </div>
                </div>
              </GlowCard>
            ))}
            
            {(!data?.tokens || data.tokens.length === 0) && !loading && (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                No tokens found in this wallet.
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-400" />
                Recent Transactions
              </h2>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {data?.transactions?.slice(0, 10).map((tx, i) => (
                <GlowCard key={i} className="p-0 border-0 bg-transparent hover:bg-zinc-900/30">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.isError === '1' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {tx.isError === '1' ? (
                            <XCircle className="w-5 h-5" />
                          ) : tx.to?.toLowerCase() === address?.toLowerCase() ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {tx.isError === '1' ? 'Transaction Failed' : 
                             tx.to?.toLowerCase() === address?.toLowerCase() ? 'Received AVAX' : 'Sent AVAX'}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {tx.timeStamp ? formatTimeAgo(tx.timeStamp) : 'Unknown time'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono ${tx.to?.toLowerCase() === address?.toLowerCase() ? 'text-green-400' : 'text-white'}`}>
                          {tx.isError !== '1' && (
                            <>{tx.to?.toLowerCase() === address?.toLowerCase() ? '+' : '-'}{(parseInt(tx.value) / 1e18).toFixed(4)} AVAX</>
                          )}
                        </div>
                        <a 
                          href={`https://testnet.snowtrace.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              ))}
              
              {(!data?.transactions || data.transactions.length === 0) && !loading && (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                  No transactions found for this address.
                </div>
              )}
              
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Stats and Actions (1/3 width) */}
        <div className="space-y-6">
          {/* AI Stats */}
          <GlowCard className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              AI Assistant Stats
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Total AI Queries</div>
                <div className="text-2xl font-bold text-white">
                  {data?.aiUsage?.totalCalls || 0}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-zinc-400 mb-1">Last Used</div>
                <div className="text-zinc-300">
                  {data?.aiUsage?.lastUsed ? 
                    new Date(data.aiUsage.lastUsed).toLocaleString() : 
                    'Never'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-zinc-400 mb-2">Favorite Tools</div>
                <div className="flex flex-wrap gap-2">
                  {data?.aiUsage?.favoriteTools?.length ? (
                    data.aiUsage.favoriteTools.map((tool, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-full">
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 text-sm">No favorite tools yet</span>
                  )}
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Quick Actions */}
          <GlowCard className="border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-400" />
              Quick Actions
            </h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/swap')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-lg transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                  <span>Swap Tokens</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>
              
              <button 
                onClick={() => router.push('/bridge')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-lg transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Bridge Assets</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>
              
              <button 
                onClick={() => router.push('/stake')}
                className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-lg transition-colors border border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Stake & Earn</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </GlowCard>

          {/* Network Status */}
          <GlowCard className="border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Network Status
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Avalanche Fuji</span>
                <span className="text-green-400 text-sm font-medium">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">AI Services</span>
                <span className="text-green-400 text-sm font-medium">Operational</span>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
