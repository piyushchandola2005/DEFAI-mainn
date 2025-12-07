"use client";

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getPortfolioData } from "@/lib/portfolio";
import { toast } from "sonner";
import ChatInterface from "@/components/chat/ChatInterface";
import DashboardNav from "@/components/dashboard/DashboardNav";
import TransactionHistory from "@/components/dashboard/TransactionHistory";
import AIActions from "@/components/dashboard/AIActions";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type PortfolioData = {
  balanceEth: string;
  tokens: any[];
  nfts: any[];
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Main data loading effect
  useEffect(() => {
    async function initUserAndFetchData() {
      if (!address) return;
      
      setLoading(true);

      try {
        // Fetch real data from blockchain
        const freshData = await getPortfolioData(address);
        
        if (freshData) {
          setData(freshData);
          setLastUpdated(new Date());

          // Save to Supabase
          const { error } = await supabase
            .from('users')
            .upsert({ 
              wallet_address: address, 
              portfolio_data: freshData,
              last_updated: new Date().toISOString()
            });
          
          if (error) {
            console.error('Supabase upsert error:', error);
          }
        }
      } catch (error) {
        console.error('Error in data fetch:', error);
        
        // Fallback: Try to load from Supabase
        const { data: dbData, error: dbError } = await supabase
          .from('users')
          .select('portfolio_data')
          .eq('wallet_address', address)
          .single();
          
        if (dbData?.portfolio_data) {
          setData(dbData.portfolio_data as PortfolioData);
          toast.warning("Showing cached data");
        }
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && address) {
      initUserAndFetchData();
    }
  }, [address, isConnected]);

  const refreshData = async () => {
    if (!isConnected || !address) return;
    
    setLoading(true);
    try {
      // Fetch real data from blockchain
      const freshData = await getPortfolioData(address);
      
      if (freshData) {
        setData(freshData);
        setLastUpdated(new Date());

        // Save to Supabase
        const { error } = await supabase
          .from('users')
          .upsert({ 
            wallet_address: address, 
            portfolio_data: freshData,
            last_updated: new Date().toISOString()
          });
        
        if (error) {
          console.error('Supabase upsert error:', error);
        }
      }
    } catch (error) {
      console.error('Error in data fetch:', error);
      
      // Fallback: Try to load from Supabase
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .select('portfolio_data')
        .eq('wallet_address', address)
        .single();
        
      if (dbData?.portfolio_data) {
        setData(dbData.portfolio_data as PortfolioData);
        toast.warning("Showing cached data");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to view your portfolio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Loading Portfolio</h2>
            <p className="text-muted-foreground">Fetching your blockchain data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = parseFloat(data?.balanceEth || "0");
  const changePercent = 2.5; // Mock change percentage
  const isPositive = changePercent >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <DashboardNav />
      <ChatInterface />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Avalanche Portfolio
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()} • Fuji Testnet` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={refreshData} variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-mono text-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                {address?.slice(0,6)}...{address?.slice(-4)}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Change</p>
                <p className="font-semibold text-green-600">+12.5%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gas Used</p>
                <p className="font-semibold">0.021 AVAX</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security</p>
                <p className="font-semibold text-green-600">Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Value Card */}
          <Card className="md:col-span-1 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/80 font-medium flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{totalValue.toFixed(4)} AVAX</div>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-300" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-300" />
                )}
                <span className={`text-sm ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {Math.abs(changePercent)}% today
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="md:col-span-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Portfolio Synced</div>
                      <div className="text-xs text-muted-foreground">Data saved to Supabase</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Wallet Connected</div>
                      <div className="text-xs text-muted-foreground">{address?.slice(0,6)}...{address?.slice(-4)}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Portfolio Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Value Card */}
              <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white border-none shadow-2xl hover:shadow-3xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white/90 font-medium flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Total Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold mb-3">{totalValue.toFixed(4)} AVAX</div>
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <ArrowUpRight className="w-5 h-5 text-green-300" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-300" />
                    )}
                    <span className={`text-lg ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                      {Math.abs(changePercent)}% today
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Card */}
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Portfolio Synced</div>
                          <div className="text-xs text-muted-foreground">Data saved to Supabase</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Wallet Connected</div>
                          <div className="text-xs text-muted-foreground">{address?.slice(0,6)}...{address?.slice(-4)}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tokens & NFTs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tokens */}
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-500" />
                      Token Holdings
                    </span>
                    <span className="text-sm text-muted-foreground bg-blue-50 px-2 py-1 rounded-full">
                      {data?.tokens?.length || 0} tokens
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {data?.tokens?.map((token: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 hover:bg-blue-50/50 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white">{token.symbol?.slice(0,2)}</span>
                          </div>
                          <div>
                            <div className="font-bold">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium">{token.balance}</div>
                          <div className="text-xs text-muted-foreground">{token.symbol}</div>
                        </div>
                      </div>
                    ))}
                    {(!data?.tokens || data.tokens.length === 0) && (
                      <div className="text-center py-10 text-muted-foreground">
                        <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No tokens found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* NFTs */}
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      NFT Collection
                    </span>
                    <span className="text-sm text-muted-foreground bg-purple-50 px-2 py-1 rounded-full">
                      {data?.nfts?.length || 0} items
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {data?.nfts?.map((nft: any, i: number) => (
                      <Card key={i} className="overflow-hidden hover:scale-105 transition-all duration-200 shadow-md hover:shadow-xl">
                        <div className="aspect-square relative bg-gradient-to-br from-purple-100 to-pink-100">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-purple-300 rounded" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold truncate text-sm">{nft.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
                        </div>
                      </Card>
                    ))}
                    {(!data?.nfts || data.nfts.length === 0) && (
                      <div className="col-span-2 text-center py-10 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No NFTs found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - AI & Transactions */}
          <div className="space-y-6">
            <AIActions />
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
