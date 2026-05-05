"use client";

import React, { useEffect } from "react";

import {
	Sheet,
	SheetContent,
	SheetTrigger,
} from "@/components/ui/sheet";

import { Plus, Sidebar as SidebarIcon, SquarePen } from "lucide-react";
import { Sidebar } from "../sidebar";
import { Message } from "ai/react";
import useChatStore from "@/app/hooks/useChatStore";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import { DashboardButton } from "../dashboard/DashboardButton";
import { useWallet } from "@solana/wallet-adapter-react";
interface ChatTopbarProps {
	isLoading: boolean;
	chatId?: string;
	messages: Message[];
	setMessages: (messages: Message[]) => void;
}

export default function ChatTopbar({
	isLoading,
	chatId,
	messages,
	setMessages,
}: ChatTopbarProps) {
	const [models, setModels] = React.useState<string[]>([]);
	const [open, setOpen] = React.useState(false);
	const [sheetOpen, setSheetOpen] = React.useState(false);

	const [isLoc, setIsLoc] = React.useState(false);
	const [mounted, setMounted] = React.useState(false);
	const setIsLocal = useChatStore((state) => state.setIsLocal);
	const isLocal = useChatStore((state) => state.isLocal);
	const { connected, disconnect, publicKey, wallet } = useWallet();
	const { setVisible } = useWalletModal();

	const shortAddress = publicKey
		? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
		: "";

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleCloseSidebar = () => {
		setSheetOpen(false);
	};

	const handleLocalChange = (isLocal: boolean) => {
		setIsLocal(isLocal);
		setIsLoc(isLocal);
		toast(isLocal ? "Private Mode enabled" : "Private Mode disabled", {
			description: `You have switched to ${isLocal ? "private" : "public"} mode.`,
			duration: 3000,
			className: "bg-avax",
		});
	}

	const router = useRouter();


	return (
		<div className="w-full flex px-4 py-6 items-center justify-between ">

			<div className="flex items-center ">

				<Button
					onClick={() => {
						router.push("/");
					}}
					variant="ghost"
					className="py-2 cursor-pointer hover:bg-secondary rounded-lg"
				>
					<Image 
						src="/red_logo.svg"
						alt="logo"
						width={40}
						height={40}
						className="w-6 h-6"
					/>
				</Button>


				<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
					<SheetTrigger asChild>
						<div className="p-3 cursor-pointer hover:bg-secondary rounded-lg">
							<SidebarIcon className="w-5 h-5" />
						</div>
					</SheetTrigger>

					<SheetContent side="left">
						<Sidebar
							chatId={chatId || ""}
							isCollapsed={false}
							isMobile={false}
							messages={messages}
							closeSidebar={handleCloseSidebar}
						/>
					</SheetContent>
				</Sheet>

				<Button
					onClick={() => {
						router.push("/home/");
					}}
					variant="ghost"
					className="p-3 cursor-pointer hover:bg-secondary rounded-lg"
				>
					<Plus className="w-6 h-6" />
				</Button>

			</div>


			<div className="flex items-center space-x-2">

				<div className="m-4 flex items-center space-x-2">
					<Switch
						id="airplane-mode"
						checked={isLocal}
						onCheckedChange={handleLocalChange}
					/>
					{
						isLocal ?
							<Label htmlFor="airplane-mode" className="text-avax">Private mode</Label> :
							<Label htmlFor="airplane-mode" className="text-muted-foreground">Private mode</Label>
					}
				</div>

				<DashboardButton />
				{mounted ? (
					connected ? (
						<Button
							variant="ghost"
							className="h-9 px-2 text-sm text-foreground hover:bg-transparent"
							onClick={() => disconnect()}
						>
							{wallet?.adapter?.name || "Wallet"} {shortAddress}
						</Button>
					) : (
						<Button
							variant="ghost"
							className="h-9 px-2 text-sm text-foreground hover:bg-transparent"
							onClick={() => setVisible(true)}
						>
							Connect Wallet
						</Button>
					)
				) : (
					<Button className="!h-9 !text-sm" variant="ghost">
						Connect Wallet
					</Button>
				)}
			</div>

		</div>
	);
}
