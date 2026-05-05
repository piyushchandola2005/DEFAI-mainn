"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { generateUUID } from "@/lib/utils";
import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const tradingBotUrl = process.env.NEXT_PUBLIC_TRADING_BOT_URL;

export default function Home() {
	const id = generateUUID();

	return (
		<main className="flex h-[calc(100dvh)] flex-col items-center ">
			{tradingBotUrl ? (
				<div className="w-full max-w-3xl px-4 pt-3 flex justify-end shrink-0">
					<Link
						href={tradingBotUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Open trading bot
						<ExternalLink className="w-4 h-4" />
					</Link>
				</div>
			) : null}
			<div className="flex-1 flex flex-col w-full max-w-3xl min-h-0">
				<ChatLayout key={id} id={id} initialMessages={[]} />
			</div>
		</main>
	);
}
