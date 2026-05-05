"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import DashboardNav from '@/components/dashboard/DashboardNav';
import ChatInterface from '@/components/chat/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Wallet } from 'lucide-react';
import { DashboardButton } from '@/components/dashboard/DashboardButton';

export default function ChatPage() {
  const { connected } = useWallet();
  const isConnected = connected;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <DashboardNav />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
              <p className="text-muted-foreground">Please connect your wallet to access the AI chat</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <DashboardNav />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            DEFAI Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Chat with AI to manage your portfolio, swap tokens, and get insights
          </p>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
