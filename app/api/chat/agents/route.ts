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

const { AGENT_DISCOVERY_ENDPOINT, AGENT_DISCOVERY_ENABLED, OPENAI_MODEL } =
  process.env;

// tools
const TOOLS = process.env.TOOLS;

console.log("OPENAI_MODEL", OPENAI_MODEL);
console.log("AGENT_DISCOVERY_ENDPOINT", AGENT_DISCOVERY_ENDPOINT);
console.log("AGENT_DISCOVERY_ENABLED", AGENT_DISCOVERY_ENABLED);
console.log("TOOLS", TOOLS);

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

    console.log("messages", messages);

    // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
    // You can remove this or use a different tool instead.
    const tools = TOOLS?.split(",").map((tool) => toolkit[tool]) || [];
    const chat = new ChatOpenAI({
      model: OPENAI_MODEL,
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
    const systemPrompts = {
      multiagent: `
      You are an AI assistant with access to various tools. You must always respond strictly in the required format.

      1- If you cannot complete a task or answer a question, respond exactly with the following message, including the tags, without any modifications or additional text:
      \`\`\`
      <agent_discovery>
      I am not able to answer this question.
      </agent_discovery>
      \`\`\`
      2- Do not provide explanations, workarounds, or alternative responses.
      3- Never break formatting rules or modify the required response structure.
      `,
      singleagent: `
      you are a helpful assistant. you can use the provided tools to answer questions and complete tasks.
      `,
    };
    const system = new SystemMessage(
      systemPrompts[multiAgentConfig.enabled ? "multiagent" : "singleagent"],
    );
    console.log("system prompt", system);
    const result = await agent.invoke({ messages: [system, ...messages] });
    const responseMessages = result.messages.map(
      convertLangChainMessageToVercelMessage,
    );
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
