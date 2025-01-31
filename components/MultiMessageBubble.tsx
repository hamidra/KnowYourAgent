import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "ai";
import clsx from "clsx";
import type { AgentMetadata } from "@/types";
import { OriginalSourceBox } from "./OriginalSourceBox";
const indirectMessageContent =
  "I've consulted my network of experts to better answer your question. Here's the response I received:";

const OriginalSourceMessageBubble = ({
  source,
  message,
}: {
  source: {
    agent: { name?: string; did?: string; remote: boolean };
    trusted: boolean;
  };
  message: Message;
}) => (
  <div className="shadow-lg  border border-gray-300 p-3 rounded-md mt-2 flex flex-col">
    <OriginalSourceBox source={source} />
    <div className="prose prose-sm">
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>
  </div>
);

export const MultiMessageBubble = ({
  message,
  originalSource = undefined,
}: {
  message: Message;
  originalSource?: {
    agent: AgentMetadata;
    trusted: boolean;
  };
}) => {
  const source = message.role;
  const emoji = source === "user" ? "🧑‍💻" : "🤖";
  const isOutgoing = source === "user";
  return (
    <div className={clsx("max-w-[80%]", isOutgoing ? "ml-auto" : "mr-auto")}>
      <div
        className={clsx(
          "flex flex-col rounded-lg p-3 mb-2",
          isOutgoing
            ? "bg-neutral-200 text-neutral-800"
            : "bg-white text-neutral-800 self-start",
        )}
      >
        <div
          className={clsx(
            "font-semibold text-2xl mb-1",
            isOutgoing ? "ml-auto" : "mr-auto",
          )}
        >
          {emoji}
        </div>
        <div className="prose prose-sm overflow-x-auto">
          <ReactMarkdown>
            {originalSource?.agent?.remote
              ? indirectMessageContent
              : message.content}
          </ReactMarkdown>
        </div>
        {originalSource?.agent?.remote && (
          <OriginalSourceMessageBubble
            source={originalSource}
            message={message}
          />
        )}
      </div>
    </div>
  );
};
