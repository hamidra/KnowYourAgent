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
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
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
  multiAgentConfig: { enabled: boolean; endpoint?: string } = {
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
    const intermediateMessages = response.slice(0, -1);
    const finalMessage = response.slice(-1)[0];
    return {
      messages: [
        ...messages,
        ...intermediateMessages,
        new AIMessage(
          `I was not able to find a tool to help with your request. 
            I checked with other agents in my network and received this response from a remote agent: 
            \n ${finalMessage.content}`,
        ),
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

    const nextNode =
      multiAgentConfig.enabled && multiAgentConfig.endpoint
        ? "agent_discovery"
        : "single_agent";
    return nextNode;
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
      single_agent: "single_agent",
    })
    .addEdge("tools", "single_agent")
    .addEdge("agent_discovery", "single_agent")
    .addConditionalEdges("single_agent", shouldContinue);

  // Compile the graph
  return workflow.compile();
}
