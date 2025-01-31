import { AgentMetadata } from "@/types";
import clsx from "clsx";
import { Shield, Check, X } from "lucide-react";
const TrustShield = ({ trusted }: { trusted: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={`relative ${trusted ? "text-green-500" : "text-red-500"}`}>
      <Shield className="w-6 h-6" />
      {trusted ? (
        <Check className="w-3 h-3 text-green-500 font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      ) : (
        <X className="w-3 h-3 text-red-500 font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}
    </div>
    <span className="text-xs mt-1">{trusted ? "Trusted" : "Untrusted"}</span>
  </div>
);

export function OriginalSourceBox(props: {
  source: { agent: AgentMetadata; trusted: boolean };
}) {
  const { source } = props;
  return (
    <div
      className={clsx(
        " border border-gray-200 p-3 rounded-md mt-2 flex w-full flex-row justify-between",
        source.trusted ? "bg-green-100" : "bg-red-100",
      )}
    >
      <div>
        <div className="font-semibold"> From Agent: {source.agent.name}</div>
        <div className="text-sm text-gray-600">{source.agent.did}</div>
      </div>
      <TrustShield trusted={source.trusted} />
    </div>
  );
}
