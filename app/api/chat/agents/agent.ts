import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  ChatMessage,
} from "@langchain/core/messages";
import { Message as VercelChatMessage } from "ai";
import { ChatOpenAI } from "@langchain/openai";

import { StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { randomUUID } from "crypto";
import { ResponseMetadata } from "@/types/Message";

export const convertVercelMessageToLangChainMessage = (
  message: VercelChatMessage,
) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
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
  humanMessage: BaseMessage,
) {
  try {
    const messages = [convertLangChainMessageToVercelMessage(humanMessage)];
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
    if (!remoteAgentResponse || !remoteAgentResponse.length) {
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
    modelName: "gpt-4-turbo-preview",
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
    const userMessage = messages.findLast((msg) => msg._getType() === "human");
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
        ...response.map((remoteMessage) => {
          remoteMessage.response_metadata.remote = true;
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
    return "end";
  }

  function shouldContinue(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    // If there's a tool call, route to tools
    if (lastMessage?.tool_calls?.length) {
      return "tools";
    } else {
      return END;
    }
  }

  // Create and configure the graph
  const workflow = new StateGraph<AgentState>({ channels: graphState })
    // Add nodes
    .addNode("multi_agent", multiAgentNode)
    .addNode("single_agent", singleAgentNode)
    .addNode("tools", toolNode)
    .addNode("agent_discovery", agentDiscoveryNode)
    // Add edges
    .addEdge(START, "multi_agent")
    .addConditionalEdges("multi_agent", routeInitial, {
      tools: "tools",
      agent_discovery: "agent_discovery",
      end: END,
    })
    .addEdge("tools", "single_agent")
    .addEdge("agent_discovery", END)
    .addConditionalEdges("single_agent", shouldContinue);

  // Compile the graph
  return workflow.compile();
}
