import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { askForConfirmation } from "./tools/askForConfirmation";
import { getLocation } from "./tools/getLocation";
import { createOllama } from "ollama-ai-provider";
import { send } from "./tools/send";
import { convert } from "./tools/convert";
import { getAvaxBalance } from "./tools/getAvaxBalance";
import { swap } from "./tools/swap";

export const maxDuration = 30;

const LOCAL_MODELS = {
	"llama": "llama3.1:latest",
	"mistral": "mistral:latest",
	"deepseek": "deepseek-r1:8b",
}

const systemPrompt = {
    role: "system",
    content: `
    You are an AI-powered DeFi assistant, built by Piyush Chandola and Ashmit Khurana as their final year project for Dronacharya Group of Institutions. You specialize in DeFi, cross-chain operations, and AI-driven automation. Your job is to help users execute financial actions efficiently and safely using available tools.

    CRITICAL RULE FOR TOOL USE: 
    NEVER ask for permission in the chat text to execute tools. Instead, call the 'askForConfirmation' tool directly when you need user approval. However, for read-only actions like checking the user's balance, you do not need to ask for confirmation—just proceed.

    Tone & Interaction Style:
    - Act like a close friend. Use familiar terms like "bro" or "yo" to make the user feel comfortable.
    - Do NOT use emojis.
    - Your goal is to be helpful, confident, and transparent.
    - If a feature isn’t available, be honest—don't make things up.

    Capabilities & Actions:
    1. DeFi Position Management
       - Execute swaps, bridges, staking, and liquidity provision via natural language.
       - Manage yield farming positions.
       - Perform safety checks and show transaction previews before execution.

    2. Cross-Chain Migration
       - Automate bridging and swapping across chains while optimizing gas fees.
       - Find the best execution paths for seamless transfers.

    Core Actions You Can Handle:
    - Send (transfer assets)
    - Conversion (exchange assets)
    - Swap (exchange tokens)
    - Bridge (move assets between chains) - *Note: Not implemented yet*
    - Stake (earn rewards by locking assets) - *Note: Not implemented yet*
    `
}


const selectedLocalModel = LOCAL_MODELS["llama"];

export async function POST(req: Request) {
	try {
		const { messages, isLocal } = await req.json();
		console.log("[CHAT-API] Incoming messages:", messages);
		console.log('isLocal:', isLocal);
		
		messages.unshift(systemPrompt);

		const tools = {
			askForConfirmation,
			send,
			convert,
			getAvaxBalance,
			swap,
		};


		let result;

		if (!isLocal) {
			result = streamText({
				model: openai("gpt-4o"),
				messages,
				tools,
				maxSteps: 5,
			});
		} else {
			const ollama = createOllama({ baseURL: process.env.OLLAMA_URL + "/api" });
			result = streamText({
				model: ollama(selectedLocalModel, { simulateStreaming: true }),
				messages,
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
