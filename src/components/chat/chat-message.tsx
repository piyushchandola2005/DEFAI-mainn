import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { ChatRequestOptions, ToolInvocation } from "ai";
import { Message } from "ai/react";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import Image from "next/image";
import { memo, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ButtonWithTooltip from "../button-with-tooltip";
import CodeDisplayBlock from "../code-display-block";
import { Button } from "../ui/button";
import {
	ChatBubble,
	ChatBubbleAvatar,
	ChatBubbleMessage,
} from "../ui/chat/chat-bubble";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import ToolExecutor from "./ToolExecutor";
import SendResultDialog from "./SendResultDialog";
import {
	useConnection,
	useWallet,
} from "@solana/wallet-adapter-react";
import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
} from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { jupiterSwap } from "@/lib/jupiter-swap";
import { transferSol, transferSplToken } from "@/lib/solana-transfer";
import { getTxExplorerUrl, WSOL_MAINNET } from "@/lib/solana-config";
import { resolveMintSymbolOrAddress } from "@/constants/solana-tokens";

export type ChatMessageProps = {
	message: Message;
	isLast: boolean;
	isLoading: boolean | undefined;
	reload: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
	addToolResult?: (args: { toolCallId: string; result: string }) => void;
};

const MOTION_CONFIG = {
	initial: { opacity: 0, scale: 1, y: 20, x: 0 },
	animate: { opacity: 1, scale: 1, y: 0, x: 0 },
	exit: { opacity: 0, scale: 1, y: 20, x: 0 },
	transition: {
		opacity: { duration: 0.1 },
		layout: {
			type: "spring",
			bounce: 0.3,
			duration: 0.2,
		},
	},
};

function SendCompleteCard({
	result,
	action,
}: {
	result: string;
	action: string;
}) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<div className="border w-full border-border p-4 mb-8 rounded-md shadow-sm">
			<p className="font-semibold text-sm mb-2">{action} complete</p>
			<p className="text-xs">Your {action} was processed successfully.</p>
			<div className="mt-6">
				<SendResultDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					result={result}
				/>
			</div>
		</div>
	);
}

async function humanInputToRawAmount(
	connection: Connection,
	inputMint: string,
	amountHuman: number
): Promise<string> {
	const mintResolved = resolveMintSymbolOrAddress(inputMint);
	if (mintResolved === WSOL_MAINNET) {
		return String(Math.round(amountHuman * LAMPORTS_PER_SOL));
	}
	const mintPk = new PublicKey(mintResolved);
	const info = await getMint(connection, mintPk);
	const dec = info.decimals;
	return String(BigInt(Math.round(amountHuman * Math.pow(10, dec))));
}

function formatRpcError(error: unknown): string {
	const msg =
		error instanceof Error ? error.message : "Unknown RPC error";
	if (msg.includes("403") || msg.toLowerCase().includes("access forbidden")) {
		return "RPC endpoint access forbidden (403). Update NEXT_PUBLIC_SOLANA_RPC_URL to a valid Solana RPC URL (with API key if required).";
	}
	return msg;
}

function ChatMessage({
	message,
	isLast,
	isLoading,
	reload,
	addToolResult,
}: ChatMessageProps) {
	const [isCopied, setIsCopied] = useState<boolean>(false);
	const { connection } = useConnection();
	const wallet = useWallet();
	const { publicKey } = wallet;

	const { cleanContent } = useMemo(() => {
		return {
			cleanContent: message.content
				.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "")
				.trim(),
		};
	}, [message.content]);

	const contentParts = useMemo(() => cleanContent.split("```"), [cleanContent]);

	const handleCopy = () => {
		navigator.clipboard.writeText(message.content);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 1500);
	};

	const renderContent = () =>
		contentParts.map((part, index) =>
			index % 2 === 0 ? (
				<Markdown key={index} remarkPlugins={[remarkGfm]}>
					{part}
				</Markdown>
			) : (
				<pre className="whitespace-pre-wrap" key={index}>
					<CodeDisplayBlock code={part} />
				</pre>
			)
		);

	const renderToolInvocations = () => {
		if (!message.toolInvocations) return null;

		return message.toolInvocations.map((toolInvocation: ToolInvocation) => {
			const { toolCallId, toolName } = toolInvocation;

			const confirmResult = (result: string) => {
				if (!addToolResult) return;
				addToolResult({ toolCallId, result });
			};

			if (toolName === "convert") {
				if (!("result" in toolInvocation)) {
					return (
						<div key={toolCallId}>Tool executing issue</div>
					);
				}

				return (
					<div key={toolCallId} className="mt-2">
						<SendCompleteCard
							result={toolInvocation.result as string}
							action="Convertion"
						/>
					</div>
				);
			}

			if (toolName === "send") {
				if (!("result" in toolInvocation)) {
					return (
						<ToolExecutor
							key={toolCallId}
							toolCallId={toolCallId}
							addToolResult={addToolResult}
							executeTool={async () => {
								const args = toolInvocation.args as {
									to: string;
									amount: number;
									asset?: "SOL" | "SPL";
									mint?: string;
								};
								const { to, amount, mint } = args;
								const asset =
									args.asset ??
									(mint ? "SPL" : "SOL");
								try {
									let sig: string;
									if (asset === "SOL") {
										sig = await transferSol({
											connection,
											wallet,
											to,
											amount,
										});
									} else {
										if (!mint) throw new Error("SPL transfer requires mint");
										sig = await transferSplToken({
											connection,
											wallet,
											mint,
											to,
											amount,
										});
									}
									return JSON.stringify({
										message: "Transaction sent!",
										amount: `${amount} ${asset === "SOL" ? "SOL" : "SPL"}`,
										from: publicKey?.toBase58(),
										to,
										hash: sig,
										explorerLink: getTxExplorerUrl(sig),
									});
								} catch (error) {
									console.error("Transaction cancelled or error:", error);
									return JSON.stringify({
										error: formatRpcError(error),
										status: "cancelled",
									});
								}
							}}
						/>
					);
				}
				if (
					toolInvocation.result === "Transaction cancelled." ||
					(typeof toolInvocation.result === "string" &&
						toolInvocation.result.includes("\"status\":\"cancelled\""))
				) {
					return (
						<div key={toolCallId} className="mt-2">
							<div className="border w-full border-border p-4 mb-8 rounded-md shadow-sm">
								<p className="font-semibold text-sm mb-2">Transaction Cancelled</p>
								<p className="text-xs">The transaction was cancelled.</p>
							</div>
						</div>
					);
				}

				return (
					<div key={toolCallId} className="mt-2">
						<SendCompleteCard
							result={toolInvocation.result as string}
							action="Send"
						/>
					</div>
				);
			}

			if (toolName === "swap") {
				if (!("result" in toolInvocation)) {
					return (
						<ToolExecutor
							key={toolCallId}
							toolCallId={toolCallId}
							addToolResult={addToolResult}
							executeTool={async () => {
								try {
									const args = toolInvocation.args as {
										inputMint: string;
										outputMint: string;
										amount: number;
										slippageBps?: number;
									};
									const inputMint = resolveMintSymbolOrAddress(
										args.inputMint
									);
									const outputMint = resolveMintSymbolOrAddress(
										args.outputMint
									);
									const amountRaw = await humanInputToRawAmount(
										connection,
										inputMint,
										args.amount
									);
									const { signature } = await jupiterSwap({
										connection,
										wallet,
										inputMint,
										outputMint,
										amountRaw,
										slippageBps: args.slippageBps ?? 100,
									});
									return JSON.stringify({
										message: "Swap executed successfully!",
										amountIn: `${args.amount} (input token units)`,
										adress: publicKey?.toBase58(),
										transactionHash: signature,
										explorerLink: getTxExplorerUrl(signature),
									});
								} catch (error) {
									console.error("Swap failed:", error);
									return JSON.stringify({
										error: formatRpcError(error),
										status: "cancelled",
									});
								}
							}}
						/>
					);
				}

				if (toolInvocation.result === "Transaction cancelled.") {
					return (
						<div key={toolCallId} className="mt-2">
							<div className="border w-full border-border p-4 mb-8 rounded-md shadow-sm">
								<p className="font-semibold text-sm mb-2">Transaction Cancelled</p>
								<p className="text-xs">The transaction was cancelled.</p>
							</div>
						</div>
					);
				}

				return (
					<div key={toolCallId} className="mt-2">
						<SendCompleteCard
							result={toolInvocation.result as string}
							action="Swap"
						/>
					</div>
				);
			}

			if (toolName === "askForConfirmation") {
				const { actionType, message, destination, amount, tokenName } =
					toolInvocation.args as {
						actionType: string;
						message: string;
						destination?: string;
						amount?: number | string;
						tokenName?: string;
					};

				const user_adress = publicKey?.toBase58();

				const parameters = {
					destination,
					user_adress,
					amount,
					tokenName,
				};

				if ("result" in toolInvocation) {
					return (
						<div key={toolCallId} className="mt-2">
							<div className="border w-full border-border p-4 mb-3 rounded-md shadow-sm">
								<p className="font-semibold text-sm mb-2">Confirmation Given</p>
								<p className="text-xs">{toolInvocation.result}</p>
							</div>
						</div>
					);
				}

				return (
					<div key={toolCallId} className="mt-2">
						<ConfirmationDialog
							actionType={actionType as "swap" | "bridge" | "send"}
							message={message}
							parameters={parameters}
							onConfirm={() => confirmResult("Yes")}
							onCancel={() => confirmResult("No")}
							toolCallId={toolCallId}
							addToolResult={addToolResult}
						/>
					</div>
				);
			}

			if (toolName === "getSolBalance") {
				if (!("result" in toolInvocation)) {
					return (
						<ToolExecutor
							key={toolCallId}
							toolCallId={toolCallId}
							addToolResult={addToolResult}
							executeTool={async () => {
								try {
									if (!publicKey) {
										return JSON.stringify({ error: "Wallet not connected" });
									}
									const lamports = await connection.getBalance(publicKey);
									const sol = lamports / LAMPORTS_PER_SOL;
									return JSON.stringify({
										balanceLamports: lamports,
										balanceSol: sol,
										address: publicKey.toBase58(),
									});
								} catch (error) {
									return JSON.stringify({
										error: formatRpcError(error),
									});
								}
							}}
						/>
					);
				}

				return (
					<SendCompleteCard
						key={toolCallId}
						result={toolInvocation.result as string}
						action="Get Balance"
					/>
				);
			}

			if (!("result" in toolInvocation)) {
				return (
					<div key={toolCallId} className="mt-2">
						{`Calling ${toolName}...`}
					</div>
				);
			}

			return null;
		});
	};

	const renderActionButtons = () =>
		message.role === "assistant" && (
			<div className="pt-2 flex gap-1 items-center text-muted-foreground">
				{!isLoading && (
					<ButtonWithTooltip side="bottom" toolTipText="Copy">
						<Button
							onClick={handleCopy}
							variant="ghost"
							size="icon"
							className="h-4 w-4"
						>
							{isCopied ? (
								<CheckIcon className="w-3.5 h-3.5 transition-all" />
							) : (
								<CopyIcon className="w-3.5 h-3.5 transition-all" />
							)}
						</Button>
					</ButtonWithTooltip>
				)}
				{!isLoading && isLast && (
					<ButtonWithTooltip side="bottom" toolTipText="Regenerate">
						<Button
							variant="ghost"
							size="icon"
							className="h-4 w-4"
							onClick={() => reload()}
						>
							<RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
						</Button>
					</ButtonWithTooltip>
				)}
			</div>
		);

	return (
		<motion.div
			{...MOTION_CONFIG}
			className="flex flex-col gap-2 whitespace-pre-wrap"
		>
			<ChatBubble variant={message.role === "user" ? "sent" : "received"}>
				{message.role === "assistant" && (
					<ChatBubbleAvatar
						src="/yellow_logo.svg"
						width={6}
						height={6}
						className="object-contain"
					/>
				)}
				<ChatBubbleMessage>
					{renderToolInvocations()}
					{renderContent()}
					{renderActionButtons()}
				</ChatBubbleMessage>
			</ChatBubble>
		</motion.div>
	);
}

export default memo(
	ChatMessage,
	(prevProps, nextProps) => {
		if (nextProps.isLast) return false;
		return (
			prevProps.isLast === nextProps.isLast &&
			prevProps.message === nextProps.message
		);
	}
);
