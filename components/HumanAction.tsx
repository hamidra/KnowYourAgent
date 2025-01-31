import type { HumanActionWithOrigin } from "@/types";
import { OriginalSourceBox } from "./OriginalSourceBox";

export function HumanActionStep(props: { humanAction: HumanActionWithOrigin }) {
  const { humanAction } = props;
  const { action, from } = humanAction;
  const { url, metadata } = action;
  const { name, description, logo, title, btnText } = metadata;
  return (
    <div className="border gap-3 shadow-sm flex flex-col items-center justify-center w-full h-full p-3">
      {from?.remote && (
        <OriginalSourceBox source={{ agent: from, trusted: true }} />
      )}
      <div className="flex flex-row gap-3 items-center justify-center w-full h-full">
        {logo && <img src={logo} alt={name} className="w-16 h-16" />}
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h1 className="text-2xl">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
        <a
          href={url}
          className="bg-blue-500 text-white px-4 py-2 rounded-md text-center"
        >
          {btnText || "Continue"}
        </a>
      </div>
    </div>
  );
}
