import React from "react";
import ReactMarkdown from "react-markdown";
import { Shield, Check, X } from "lucide-react";

const TrustShield = ({ trusted }: { trusted: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={`relative ${trusted ? "text-green-500" : "text-red-500"}`}>
      <Shield className="w-6 h-6" />
      {trusted ? (
        <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      ) : (
        <X className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
    </div>
    <span className="text-xs mt-1">{trusted ? "Trusted" : "Untrusted"}</span>
  </div>
);

const SourceInfo = ({
  source,
}: {
  source: { name: string; did: string; trusted: boolean };
}) => (
  <div className="bg-gray-100 border border-gray-200 p-3 rounded-md mt-2 flex items-start justify-between">
    <div>
      <div className="font-semibold">Expert: {source.name}</div>
      <div className="text-sm text-gray-600">ID: #{source.id}</div>
    </div>
    <TrustShield trusted={source.trusted} />
  </div>
);

export const MessageBubble = ({
  sender,
  message,
  source = undefined,
  isOutgoing = false,
}: {
  sender: string;
  message: string;
  source?: { name: string; did: string; remote: boolean; trusted: boolean };
  isOutgoing: boolean;
}) => {
  return (
    <div className={`max-w-lg ${isOutgoing ? "ml-auto" : "mr-auto"}`}>
      <div
        className={`
        rounded-lg p-4
        ${
          isOutgoing
            ? "bg-blue-600 text-white"
            : "bg-white shadow-sm border border-gray-200 text-gray-900"
        }
      `}
      >
        <div className="font-semibold mb-1">{sender}</div>
        <div className="prose prose-sm">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
        {source && <SourceInfo source={source} />}
      </div>
    </div>
  );
};

// Example usage component
export const MessageExample = () => {
  const messages = [
    {
      sender: "John Doe",
      message: "Here's a **direct** message with some _markdown_ formatting",
      isOutgoing: false,
    },
    {
      sender: "John Doe",
      message: "Here's what our expert says about your question:",
      source: {
        name: "Dr. Smith",
        id: "12345",
        trusted: true,
      },
      isOutgoing: false,
    },
    {
      sender: "John Doe",
      message: "And here's another response:",
      source: {
        name: "Jane Wilson",
        id: "67890",
        trusted: false,
      },
      isOutgoing: false,
    },
  ];

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          sender={msg.sender}
          message={msg.message}
          source={msg.source}
          isOutgoing={msg.isOutgoing}
        />
      ))}
    </div>
  );
};
