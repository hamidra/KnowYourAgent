import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { didTool } from "@/ai-tools/ai-id";
import { walletTool } from "@/ai-tools/ai-wallet";
import { emailTool } from "@/ai-tools/gmail";
import { shopifyTool } from "@/ai-tools/shopify";
import { createCustomAgentGraph } from "./agent";
import {
  convertVercelMessageToLangChainMessage,
  convertLangChainMessageToVercelMessage,
} from "./agent";

import { SystemMessage } from "@langchain/core/messages";

const { AGENT_DISCOVERY_ENDPOINT, AGENT_DISCOVERY_ENABLED } = process.env;

// tools
const TOOLS = process.env.TOOLS;

const toolkit: Record<string, any> = {
  gmail: emailTool,
  shopify: shopifyTool,
  did: didTool,
  wallet: walletTool,
};
/**
 * This handler initializes and calls an tool calling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter(
        (message: VercelChatMessage) =>
          message.role === "user" || message.role === "assistant",
      )
      .map(convertVercelMessageToLangChainMessage);

    // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
    // You can remove this or use a different tool instead.
    const tools = TOOLS?.split(",").map((tool) => toolkit[tool]) || [];

    const chat = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
    });

    /**
     * Use a prebuilt LangGraph agent.
     */
    const multiAgentConfig = {
      enabled: AGENT_DISCOVERY_ENABLED == "true",
      endpoint: AGENT_DISCOVERY_ENDPOINT,
    };

    const agent = await createCustomAgentGraph(tools, multiAgentConfig);

    /**
     * We could also pick intermediate steps out from `streamEvents` chunks, but
     * they are generated as JSON objects, so streaming and displaying them with
     * the AI SDK is more complicated.
     */
    const system = new SystemMessage(`
      You are an AI agent with access to various tools. 
      You should always respond with the following message when you can not complete a task or answer a question:

      <agent_discovery>
      I am not able to answer this question.
      </agent_discovery>
    `);

    const result = await agent.invoke({ messages: [system, ...messages] });
    console.log(result);
    const responseMessages = result.messages.map(
      convertLangChainMessageToVercelMessage,
    );
    console.log("responseMessages\n\n", responseMessages);
    return NextResponse.json(
      {
        messages: responseMessages,
      },
      { status: 200 },
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
