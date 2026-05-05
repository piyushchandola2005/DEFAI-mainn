import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { askForConfirmation } from "./tools/askForConfirmation";
import { createOllama } from "ollama-ai-provider";
import { send } from "./tools/send";
import { convert } from "./tools/convert";
import { getSolBalance } from "./tools/getSolBalance";
import { swap } from "./tools/swap";
import { getTokenInsights } from "./tools/getTokenInsights";

export const maxDuration = 30;

const LOCAL_MODELS = {
	llama: "llama3.1:latest",
	mistral: "mistral:latest",
	deepseek: "deepseek-r1:8b",
};

const systemPrompt = {
	role: "system",
	content: `
    You are an AI-powered Solana DeFi assistant focused on memecoins and SPL tokens, built by Piyush Chandola and Ashmit Khurana as their final year project for Dronacharya Group of Institutions. You help users trade and move assets on Solana using natural language and the available tools.

    CRITICAL RULE FOR TOOL USE: 
    NEVER ask for permission in the chat text alone to execute tools that move funds. Instead, call the 'askForConfirmation' tool directly when you need user approval. For read-only actions like checking balances, call tools without confirmation.

    SOLANA / MEMECOIN SAFETY:
    - Only Solana mainnet (or the RPC the app is configured for). Do not claim Avalanche, Ethereum, or cross-chain actions unless explicitly implemented.
    - For swaps involving memecoins, require the user to confirm INPUT and OUTPUT mint addresses (or paste the contract/mint). Never invent or guess mint addresses.
    - Mention slippage risk for thin liquidity pairs.
    - Wrapped SOL mint for swapping from/to native SOL is So11111111111111111111111111111111111111112.
    - If user shares a token CA/mint, call getTokenInsights and summarize BirdEye findings clearly (price, liquidity/volume context, and notable risk/security fields when available).
    - If user says "buy <CA/mint>" and does not provide pair details, assume they mean BUY that token using SOL:
      1) treat outputMint as the provided CA/mint,
      2) treat inputMint as wrapped SOL mint So11111111111111111111111111111111111111112,
      3) ask only for amount in SOL if missing,
      4) then call askForConfirmation and swap.
    - If user sends only a CA/mint with no other context, call getTokenInsights first and provide a concise token summary, then ask whether to buy and how much SOL.

    Tone & Interaction Style:
    - Act like a close friend. Use familiar terms like "bro" or "yo" where appropriate.
    - Do NOT use emojis.
    - Be honest when something is not supported.

    Capabilities:
    - Send SOL or SPL tokens (send tool).
    - Swap SPL tokens via Jupiter (swap tool) using mint addresses.
    - Check SOL balance (getSolBalance).
    - Fiat/crypto price quotes via convert tool where applicable.
    - Fetch token contract insights from BirdEye when users provide a Solana CA/mint (getTokenInsights).
    `,
};

const selectedLocalModel = LOCAL_MODELS["llama"];

export async function POST(req: Request) {
	try {
		const { messages, isLocal } = await req.json();
		console.log("[CHAT-API] Incoming messages:", messages);
		console.log("isLocal:", isLocal);

		// Guard against persisted assistant tool calls without results.
		// The AI SDK throws if a tool invocation is replayed in `call` state.
		const safeMessages = (messages ?? []).map((message: any) => {
			if (message?.role !== "assistant") return message;
			if (!Array.isArray(message.toolInvocations)) return message;

			const unresolved = message.toolInvocations.some(
				(tool: any) =>
					tool &&
					typeof tool === "object" &&
					(tool.state === "call" || !("result" in tool))
			);

			if (!unresolved) return message;

			return {
				role: "assistant",
				content: typeof message.content === "string" ? message.content : "",
			};
		});

		safeMessages.unshift(systemPrompt);

		const tools = {
			askForConfirmation,
			send,
			convert,
			getSolBalance,
			swap,
			getTokenInsights,
		};

		let result;

		if (!isLocal) {
			result = streamText({
				model: openai("gpt-4o"),
				messages: safeMessages,
				tools,
				maxSteps: 5,
			});
		} else {
			const ollama = createOllama({ baseURL: process.env.OLLAMA_URL + "/api" });
			result = streamText({
				model: ollama(selectedLocalModel, { simulateStreaming: true }),
				messages: safeMessages,
				tools,
				maxSteps: 5,
			});
		}

		return result.toDataStreamResponse({
			getErrorMessage: (error) => {
				console.error("ERREUR AVEC LE STREAMING DE LA RESPONSE API CALL:", error);
				return "An error occurred during the API call.";
			},
		});
	} catch (err) {
		console.error("ERREUR PLUS GLOBALE", err);
		return new Response("Internal Server Error", { status: 500 });
	}
}
