"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import React, { useEffect, useState } from "react";
import useChatStore from "@/app/hooks/useChatStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const getChatById = useChatStore((state) => state.getChatById);
  const chat = getChatById(id);

  if (!hydrated) {
    return (
      <main className="flex h-[calc(100dvh)] flex-col items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </main>
    );
  }

  if (!chat) {
    return (
      <main className="flex h-[calc(100dvh)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Chat not found in local history.</p>
        <Link href="/home">
          <Button variant="secondary">Open a new chat</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <ChatLayout
        key={id}
        id={id}
        initialMessages={chat.messages}
        //navCollapsedSize={10}
        //defaultLayout={[30, 160]}
      />
    </main>
  );
}
