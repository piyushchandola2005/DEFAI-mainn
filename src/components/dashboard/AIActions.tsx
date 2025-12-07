"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightLeft, 
  SendHorizontal, 
  Wallet, 
  TrendingUp, 
  Sparkles,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

interface AIAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  action: string;
}

export default function AIActions() {
  const { address, isConnected } = useAccount();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const actions: AIAction[] = [
    {
      id: 'swap',
      title: 'Swap Tokens',
      description: 'AI-powered token swapping with best rates',
      icon: <ArrowRightLeft className="w-5 h-5 text-blue-500" />,
      placeholder: 'e.g., Swap 1 AVAX to USDC',
      action: 'swap'
    },
    {
      id: 'send',
      title: 'Send Tokens',
      description: 'Send tokens to any address naturally',
      icon: <SendHorizontal className="w-5 h-5 text-green-500" />,
      placeholder: 'e.g., Send 10 USDC to 0x1234...',
      action: 'send'
    },
    {
      id: 'portfolio',
      title: 'Portfolio Analysis',
      description: 'Get AI insights on your portfolio',
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      placeholder: 'e.g., Analyze my portfolio performance',
      action: 'analyze'
    },
    {
      id: 'balance',
      title: 'Check Balance',
      description: 'Quick balance check with AI',
      icon: <Wallet className="w-5 h-5 text-orange-500" />,
      placeholder: 'e.g., What is my AVAX balance?',
      action: 'balance'
    }
  ];

  const handleAction = async () => {
    if (!isConnected || !inputValue.trim()) return;

    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call your AI agent
      toast.success(`AI processed: ${inputValue}`);
      
      // Reset after success
      setInputValue('');
      setActiveAction(null);
      
      // Here you would also update transaction history
      // addTransaction({ type: activeAction, amount: extractedAmount, ... });
      
    } catch (error) {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Connect wallet to use AI features</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          AI Assistant
          <Badge variant="secondary" className="text-xs">
            Powered by DEFAI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => setActiveAction(action.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                activeAction === action.id
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {action.icon}
                <span className="font-medium text-sm">{action.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          ))}
        </div>

        {activeAction && (
          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              {actions.find(a => a.id === activeAction)?.icon}
              <span className="font-medium">
                {actions.find(a => a.id === activeAction)?.title}
              </span>
            </div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={actions.find(a => a.id === activeAction)?.placeholder}
              className="bg-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAction()}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAction} 
                disabled={!inputValue.trim() || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setActiveAction(null);
                  setInputValue('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!activeAction && (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an action to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
