import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  ChatMessage,
  isSystemMessage,
  isChatMessage,
} from "@langchain/core/messages";
import { Message } from "ai";
import { ChatOpenAI } from "@langchain/openai";

import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { randomUUID } from "crypto";
import { ResponseMetadata } from "@/types";

const { DID, NAME } = process.env;
const AGENT_CONTEXT_WINDOW = Number(process.env.AGENT_CONTEXT_WINDOW) || 3;

type VercelChatMessage = Message & { annotations?: ResponseMetadata[] };

export const convertVercelMessageToLangChainMessage = (
  message: VercelChatMessage,
) => {
  let resultMessage;
  if (message.role === "user") {
    resultMessage = new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    resultMessage = new AIMessage(message.content);
  } else {
    resultMessage = new ChatMessage(message.content, message.role);
  }
  let response_metadata = message.annotations?.[0] as ResponseMetadata;
  if (response_metadata) {
    resultMessage.response_metadata = { ...response_metadata };
  }
  return resultMessage;
};

export const convertLangChainMessageToVercelMessage = (
  message: BaseMessage,
) => {
  let vercelMessage: Record<string, any>;
  if (message._getType() === "human") {
    vercelMessage = {
      id: message.id || randomUUID(),
      content: message.content as string,
      role: "user",
    };
  } else if (message._getType() === "ai") {
    vercelMessage = {
      id: message.id || randomUUID(),
      content: message.content as string,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else if (isChatMessage(message)) {
    vercelMessage = { content: message.content, role: message.role };
  } else {
    vercelMessage = { content: message.content, role: message._getType() };
  }
  vercelMessage.annotations = [{ ...message.response_metadata }];
  return vercelMessage as VercelChatMessage;
};

// Define the state interface for type safety
interface AgentState {
  messages: BaseMessage[];
}

// Create the graph state channels
const graphState = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
};

// Add this function before createCustomAgentGraph
async function callRemoteAgent(
  remoteAgentEndpoint: string,
  humanMessages: BaseMessage[],
) {
  try {
    const messages = humanMessages.map(convertLangChainMessageToVercelMessage);
    const response = await fetch(remoteAgentEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Remote agent call failed: ${response.statusText}`);
    }

    const data = await response.json();
    const remoteAgentResponse: VercelChatMessage[] | undefined = data.messages;
    if (!remoteAgentResponse?.length) {
      throw new Error(`Remote agent did not respond`);
    }
    return remoteAgentResponse.map(convertVercelMessageToLangChainMessage);
  } catch (error) {
    console.error("Error calling remote agent:", error);
    return [
      new AIMessage({
        content:
          "I apologize, but I encountered an error while trying to connect with other agents.",
      }),
    ];
  }
}
export async function createCustomAgentGraph(
  modelName: string,
  tools: any[],
  multiAgentConfig: {
    enabled: boolean;
    endpoint?: string;
  } = {
    enabled: false,
  },
) {
  // Initialize the model and bind tools
  const model = new ChatOpenAI({
    modelName: modelName,
    temperature: 0,
  }).bindTools(tools);

  // Create tool execution node
  const toolNode = new ToolNode<AgentState>(tools);

  // Define the agent node that handles llm calls
  async function multiAgentNode(state: AgentState) {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  }
  async function singleAgentNode(state: AgentState) {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  }

  async function metadataNode(state: AgentState) {
    const messages = state.messages.map((message) => {
      if (!message.response_metadata.agent) {
        message.response_metadata.agent = {
          name: NAME,
          did: DID,
          remote: false,
        };
      }
      return message;
    });
    return { messages };
  }

  // Define the agent discovery node
  async function agentDiscoveryNode(state: AgentState) {
    if (!multiAgentConfig.enabled || !multiAgentConfig.endpoint) {
      return {
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              "multi agent config is not enabled or no endpoint is provided",
          }),
        ],
      };
    }
    const messages = [...state.messages];

    // Get the original user prompt from the messages
    const userMessage = messages
      .filter((msg) => msg._getType() === "human")
      .slice(-AGENT_CONTEXT_WINDOW);
    if (!userMessage) {
      return {
        messages: [
          ...messages,
          new AIMessage({
            content:
              "I couldn't find the original request to forward to other agents.",
          }),
        ],
      };
    }

    // Call the remote agent with the original prompt
    const response = await callRemoteAgent(
      multiAgentConfig.endpoint,
      userMessage,
    );
    return {
      messages: [
        ...messages,
        ...response
          .filter(
            (message) =>
              !isChatMessage(message) || message.role !== "assistant",
          )
          .map((remoteMessage) => {
            const agentMetadata = remoteMessage.response_metadata.agent;
            remoteMessage.response_metadata.agent = {
              ...agentMetadata,
              remote: true,
            };
            return remoteMessage;
          }),
      ],
    };
  }

  // Define routing logic for initial agent
  function routeInitial(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

    // If there's a tool call, route to tools
    if (lastMessage?.tool_calls?.length) {
      return "tools";
    }
    if (
      multiAgentConfig.enabled &&
      multiAgentConfig.endpoint &&
      (lastMessage?.content as string).includes("<agent_discovery>")
    ) {
      return "agent_discovery";
    }
    return "metadata";
  }

  function shouldContinue(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    // If there's a tool call, route to tools
    if (lastMessage?.tool_calls?.length) {
      return "tools";
    } else {
      return "metadata";
    }
  }

  // Create and configure the graph
  const workflow = new StateGraph<AgentState>({ channels: graphState })
    // Add nodes
    .addNode("multi_agent", multiAgentNode)
    .addNode("single_agent", singleAgentNode)
    .addNode("tools", toolNode)
    .addNode("agent_discovery", agentDiscoveryNode)
    .addNode("metadata", metadataNode)
    // Add edges
    .addEdge(START, "multi_agent")
    .addConditionalEdges("multi_agent", routeInitial, {
      tools: "tools",
      agent_discovery: "agent_discovery",
      metadata: "metadata",
    })
    .addEdge("tools", "single_agent")
    .addEdge("agent_discovery", "metadata")
    .addConditionalEdges("single_agent", shouldContinue)
    .addEdge("metadata", END);

  // Compile the graph
  return workflow.compile();
}
