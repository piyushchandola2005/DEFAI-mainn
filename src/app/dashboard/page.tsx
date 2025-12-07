"use client";

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from "@/lib/supabase";
import { getPortfolioData } from "@/lib/portfolio";
import { GlowCard } from "@/components/ui/glow-card";
import { 
  TrendingUp, 
  Wallet, 
  Layers, 
  ArrowUpRight, 
  Activity, 
  PieChart,
  RefreshCw,
  ShieldCheck
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
};

type PortfolioData = {
  balanceEth: string;
  tokens: Token[];
  nfts: any[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Data Fetching Logic ---
  useEffect(() => {
    async function initUserAndFetchData() {
      if (!address) return;
      setLoading(true);
      try {
        const freshData = await getPortfolioData(address);
        if (freshData) {
          setData(freshData);
          await supabase.from('users').upsert({ 
            wallet_address: address, 
            portfolio_data: freshData,
            last_updated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
        const { data: dbData } = await supabase
          .from('users')
          .select('portfolio_data')
          .eq('wallet_address', address)
          .single();
        if (dbData?.portfolio_data) setData(dbData.portfolio_data as PortfolioData);
      } finally {
        setLoading(false);
      }
    }
    if (isConnected) initUserAndFetchData();
  }, [address, isConnected]);

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
            Command Center
          </h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            AI Agent Active • Mainnet
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2 backdrop-blur-md">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
          <span className="font-mono text-sm text-zinc-300">
            {address?.slice(0,6)}...{address?.slice(-4)}
          </span>
        </div>
      </header>

      {/* --- Key Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Worth Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Net Worth</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {loading ? "..." : `${data?.balanceEth || "0.00"} ETH`}
          </div>
          <div className="flex items-center text-sm text-green-400 gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>+2.4%</span>
            <span className="text-zinc-500 ml-1">vs last week</span>
          </div>
        </GlowCard>

        {/* Assets Count Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Assets</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {loading ? "..." : data?.tokens.length || 0}
          </div>
          <p className="text-sm text-zinc-500">Tokens across Ethereum Network</p>
        </GlowCard>

        {/* AI Status Card */}
        <GlowCard>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Health Score</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">98/100</div>
          <p className="text-sm text-zinc-500">Portfolio risk is low</p>
        </GlowCard>
      </div>

      {/* --- Main Content Split --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Token Holdings (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Holdings
            </h2>
            <button 
              onClick={() => window.location.reload()} 
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {data?.tokens.map((token, i) => (
              <GlowCard key={i} className="p-0 border-0 bg-transparent hover:bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800">
                      {token.logo ? (
                        <Image 
                          src={token.logo || '/placeholder-token.png'}
                          alt={token.symbol}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-token.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                          {token.symbol[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{token.name}</h3>
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">ERC-20</span>
                        {token.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">{token.balance}</div>
                    {/* Placeholder for USD value if we add pricing later */}
                    <div className="text-xs text-zinc-500">≈ $0.00</div>
                  </div>
                </div>
              </GlowCard>
            ))}
            
            {(!data?.tokens || data.tokens.length === 0) && (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                No tokens found. Try bridging some assets?
              </div>
            )}
          </div>
        </div>

        {/* Right Column: NFTs & Trending (1/3 width) */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-400" />
            Digital Collectibles
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {data?.nfts.map((nft, i) => (
              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image 
                  src={nft.image || '/placeholder-nft.png'}
                  alt={nft.title}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-nft.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-xs font-bold text-white truncate">{nft.title}</p>
                  <p className="text-[10px] text-zinc-300 truncate">{nft.collection}</p>
                </div>
              </div>
            ))}
            
            {/* Empty State / Placeholder Slots */}
            {(!data?.nfts || data.nfts.length < 4) && Array.from({ length: 4 - (data?.nfts?.length || 0) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 flex items-center justify-center">
                <span className="text-zinc-700 text-xs">Empty Slot</span>
              </div>
            ))}
          </div>

          {/* Quick Action Suggestion */}
          <GlowCard className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
            <h3 className="font-bold text-indigo-100 mb-2">Want to optimize yields?</h3>
            <p className="text-xs text-indigo-200/60 mb-4">
              Your idle ETH could be earning 4.5% APY on Lido or Rocket Pool.
            </p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              Ask AI Agent to Stake
            </button>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
