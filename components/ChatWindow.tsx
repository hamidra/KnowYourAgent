"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { CHAT_CONSTANTS } from "@/constants/chat";
import { Message as VercelMessage } from "ai";
import { useChat } from "ai/react";
import { useRef, useState, ReactElement, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { IntermediateStep } from "./IntermediateStep";
import { HumanActionStep } from "./HumanAction";
import { usePersistedConversation } from "@/hooks/persistedState";
import type { ResponseMetadata } from "@/types";
import { MultiMessageBubble } from "./MultiMessageBubble";
import { HumanActionWithOrigin } from "@/types";

type Message = VercelMessage & { annotations?: ResponseMetadata[] };

function parseHumanAction(message: Message): HumanActionWithOrigin | undefined {
  if (message?.role !== "system") return;
  const content = JSON.parse(message.content);

  const agent = message.annotations?.[0]?.agent;
  const action = content.observation?.humanAction;
  return action ? { from: agent, action } : undefined;
}

function getAssistantResponse(messages: Message[]) {
  if (messages.length === 0) return [];
  let responseMessages: Message[] = [messages[messages.length - 1]];
  return responseMessages.reverse();
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactElement;
  placeholder?: string;
  titleText?: string;
  emoji?: string;
  showIntermediateStepsToggle?: boolean;
}) {
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const { user } = usePrivy();
  const address = user?.wallet?.address;

  const {
    endpoint,
    emptyStateComponent,
    placeholder,
    titleText = CHAT_CONSTANTS.DEFAULT_TITLE,
    showIntermediateStepsToggle,
    emoji,
  } = props;

  const [showIntermediateSteps, setShowIntermediateSteps] = useState(false);
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);
  const [humanAction, setHumanAction] = useState<
    HumanActionWithOrigin | undefined
  >(undefined);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const { getConversation, setConversation, clearConversation } =
    usePersistedConversation<Message>(`conv-${address}` || "guest");

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: chatEndpointIsLoading,
    setMessages,
  } = useChat({
    api: endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];
      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamMode: "text",
    onError: (e) => {
      toast(e.message, {
        theme: "dark",
      });
    },
    initialMessages: getConversation(),
  });

  async function sendMessage() {
    try {
      setIntermediateStepsLoading(true);
      if (messageContainerRef.current) {
        messageContainerRef.current.classList.add("grow");
      }
      if (!messages.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, CHAT_CONSTANTS.LOADING_DELAY),
        );
      }
      if (chatEndpointIsLoading ?? intermediateStepsLoading) {
        return;
      }

      setInput("");
      const messagesWithUserReply = input
        ? messages.concat({
            id: messages.length.toString(),
            content: input,
            role: "user",
          })
        : messages;
      setMessages(messagesWithUserReply);

      // fetch LLM response
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesWithUserReply,
          show_intermediate_steps: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      const responseMessages: Message[] = json.messages;

      // Represent intermediate steps as system messages for display purposes
      // TODO: Add proper support for tool messages
      const toolCallMessages = responseMessages.filter(
        (responseMessage: Message) => {
          return (
            (responseMessage.role === "assistant" &&
              !!responseMessage.tool_calls?.length) ||
            responseMessage.role === "tool"
          );
        },
      );
      const intermediateStepMessages = [];
      for (let i = 0; i < toolCallMessages.length; i += 2) {
        const aiMessage = toolCallMessages[i];
        const toolMessage = toolCallMessages[i + 1];
        if (aiMessage && toolMessage) {
          intermediateStepMessages.push({
            id: (messagesWithUserReply.length + i / 2).toString(),
            role: "system" as const,
            content: JSON.stringify({
              action: aiMessage.tool_calls?.[0],
              observation: JSON.parse(toolMessage.content),
            }),
            annotations: toolMessage.annotations,
          });
        }
      }

      const newMessages = messagesWithUserReply;

      // parse human action from intermediate steps
      let humanAction;
      for (const message of intermediateStepMessages) {
        const action = parseHumanAction(message);
        if (!action) {
          newMessages.push(message);
          setMessages([...newMessages]);
        } else {
          humanAction = action;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, CHAT_CONSTANTS.INTERMEDIATE_STEP_DELAY),
        );
      }
      const assistantResponse = !humanAction
        ? getAssistantResponse(responseMessages as Message[])
        : [];

      setHumanAction(humanAction);
      setMessages([...newMessages, ...assistantResponse]);
    } catch (error) {
      toast(error instanceof Error ? error.message : "An error occurred", {
        theme: "dark",
        type: "error",
      });
    } finally {
      setIntermediateStepsLoading(false);
    }
  }

  // persist messages to local storage
  useEffect(() => {
    setConversation(messages as Message[]);
  }, [messages, setConversation]);

  // if the page is loaded and the last message is not from assistant, send the messages to continue.
  useEffect(() => {
    if (messages.length > 0 && messages.slice(-1)[0].role != "assistant") {
      sendMessage();
    }
  }, []);

  const memoizedMessageList = useMemo(
    () =>
      messages.length > 0
        ? [...messages].reverse().map((m, i) => {
            const agent = (m as Message).annotations?.[0]?.agent;
            return m.role === "system" ? (
              showIntermediateSteps && (
                <IntermediateStep key={m.id} message={m}></IntermediateStep>
              )
            ) : (
              <MultiMessageBubble
                key={m.id}
                message={m}
                originalSource={agent ? { agent, trusted: true } : undefined}
              ></MultiMessageBubble>
            );
          })
        : null,
    [messages, showIntermediateSteps, sourcesForMessages],
  );

  return (
    <div className="flex flex-col w-full h-full bg-neutral-100 text-neutral-800">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto px-4">
          {messages.length === 0 ? emptyStateComponent : ""}
          <div
            className="flex flex-col-reverse w-full mb-4 overflow-auto gap-4 transition-[flex-grow] ease-in-out"
            ref={messageContainerRef}
          >
            {humanAction && (
              <HumanActionStep humanAction={humanAction}></HumanActionStep>
            )}
            {memoizedMessageList}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border shadow-lg rounded-xl border-neutral-200">
        <div className="mb-2">
          {showIntermediateStepsToggle && (
            <div className="flex items-center space-x-2 text-neutral-600">
              <input
                type="checkbox"
                id="show_intermediate_steps"
                name="show_intermediate_steps"
                checked={showIntermediateSteps}
                onChange={(e) => setShowIntermediateSteps(e.target.checked)}
                className="rounded border-neutral-300 
                         text-neutral-600 bg-white
                         focus:ring-neutral-300"
              />
              <label htmlFor="show_intermediate_steps">
                Show intermediate steps
              </label>
            </div>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            input && sendMessage();
          }}
          className="flex space-x-4"
        >
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                input && sendMessage();
              }
            }}
            rows={2}
            className="flex-1 p-2 bg-neutral-100 text-neutral-800 
                     border border-neutral-200 rounded-lg
                     focus:outline-none focus:ring-1 focus:ring-neutral-300
                     placeholder-neutral-500 resize-none"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-200 text-neutral-800
                     rounded-lg hover:bg-neutral-300
                     transition-colors duration-200"
          >
            {chatEndpointIsLoading || intermediateStepsLoading ? (
              <div role="status" className="flex justify-center">
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 animate-spin text-neutral-500"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                    className="opacity-25"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
