"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'approve';
  amount: string;
  token: string;
  from: string;
  to?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  hash: string;
}

export default function TransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadTransactions();
    }
  }, [address, loadTransactions]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // For now, simulate transaction data
      // In production, this would fetch from blockchain or your transaction tracking system
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'swap',
          amount: '100',
          token: 'USDC',
          from: 'AVAX',
          to: 'USDC',
          status: 'completed',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          hash: '0x1234...5678'
        },
        {
          id: '2',
          type: 'send',
          amount: '0.5',
          token: 'AVAX',
          from: address,
          to: '0x9876...5432',
          status: 'completed',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          hash: '0xabcd...efgh'
        },
        {
          id: '3',
          type: 'receive',
          amount: '250',
          token: 'USDT',
          from: '0x5555...6666',
          to: address,
          status: 'pending',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          hash: '0x1111...2222'
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'receive':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'swap':
        return <ArrowUpRight className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </div>
          <Badge variant="outline" className="text-xs">
            {transactions.length} transactions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{tx.type}</span>
                        <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(tx.status)}
                            {tx.status}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.amount} {tx.token}
                        {tx.to && ` • ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
