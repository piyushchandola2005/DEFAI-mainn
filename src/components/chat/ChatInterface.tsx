"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatInterface() {
  const { address, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const normalizedAddress = address?.toLowerCase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async (chatId: string) => {
    if (!chatId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  }, []);

  const loadChats = useCallback(async () => {
    if (!normalizedAddress) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChats(data || []);

      if ((!currentChatId || !data?.some(chat => chat.id === currentChatId)) && data && data.length > 0) {
        const newActiveChatId = data[0].id;
        setCurrentChatId(newActiveChatId);
        await loadMessages(newActiveChatId);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [normalizedAddress, currentChatId, loadMessages]);

  useEffect(() => {
    if (isConnected && normalizedAddress) {
      loadChats();
    }
  }, [isConnected, normalizedAddress, loadChats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewChat = async () => {
    if (!normalizedAddress) return;

    const { data, error } = await supabase
      .from('chats')
      .insert({
        wallet_address: normalizedAddress,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating chat:', error);
    } else {
      setCurrentChatId(data.id);
      setMessages([]);
      loadChats();
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !normalizedAddress) return;

    setIsLoading(true);
    setInput('');

    try {
      let activeChatId = currentChatId;

      if (!activeChatId) {
        const { data: newChat, error: newChatError } = await supabase
          .from('chats')
          .insert({
            wallet_address: normalizedAddress,
            title: trimmedInput.slice(0, 30) || 'New Chat',
          })
          .select()
          .single();

        if (newChatError || !newChat) {
          console.error('Error creating chat before sending message:', newChatError);
          setIsLoading(false);
          return;
        }

        activeChatId = newChat.id;
        setCurrentChatId(activeChatId);
        setMessages([]);
        await loadChats();
      }

      const timestamp = new Date().toISOString();

      // Track AI usage
      const { error: usageError } = await supabase
        .from('ai_usage')
        .upsert(
          { 
            user_address: normalizedAddress,
            last_used: timestamp
          },
          { onConflict: 'user_address' }
        );

      if (usageError) {
        console.error('Error upserting AI usage row:', usageError);
      }

      const { error: rpcError } = await supabase.rpc('increment_ai_usage', { user_addr: normalizedAddress });
      if (rpcError) {
        console.error('Error incrementing AI usage via RPC:', rpcError);
        const { data: usageRow } = await supabase
          .from('ai_usage')
          .select('total_calls')
          .eq('user_address', normalizedAddress)
          .single();

        const fallbackTotal = (usageRow?.total_calls || 0) + 1;
        await supabase
          .from('ai_usage')
          .update({ total_calls: fallbackTotal, last_used: timestamp })
          .eq('user_address', normalizedAddress);
      }

      const { data: insertedMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChatId,
          role: 'user',
          content: trimmedInput,
        })
        .select('*')
        .single();

      if (userError || !insertedMessage) {
        console.error('Error saving user message:', userError);
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, insertedMessage]);

      // Simulate AI response (replace with actual AI call)
      setTimeout(async () => {
        const aiResponsePayload = {
          chat_id: activeChatId,
          role: 'assistant' as const,
          content: `I understand you said: "${trimmedInput}". This is a simulated response. In production, this would connect to your AI agent.`,
        };

        const { data: savedResponse, error: aiError } = await supabase
          .from('messages')
          .insert(aiResponsePayload)
          .select('*')
          .single();

        if (aiError || !savedResponse) {
          console.error('Error saving AI response:', aiError);
        } else {
          setMessages(prev => [...prev, savedResponse]);
        }

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 z-40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-2xl bg-background border z-50 flex flex-col">
          {/* Header */}
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">DEFAI Assistant</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Chat List / Messages */}
            {!currentChatId ? (
              <div className="flex-1 p-4">
                <div className="mb-4">
                  <Button onClick={createNewChat} className="w-full">
                    Start New Chat
                  </Button>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <Card
                        key={chat.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          loadMessages(chat.id);
                        }}
                      >
                        <CardContent className="p-3">
                          <h3 className="font-medium truncate">{chat.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your portfolio..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isLoading}
                    />
                    <Button onClick={sendMessage} disabled={isLoading} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </div>
      )}
    </>
  );
}
