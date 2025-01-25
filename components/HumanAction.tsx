import type { HumanAction } from "@/types/HumanAction";

export function HumanActionStep(props: { humanAction: HumanAction }) {
  const { humanAction } = props;
  const { url, metadata } = humanAction;
  const { name, description, logo, title, btnText } = metadata;
  return (
    <div className="border gap-3 shadow-sm flex flex-row items-center justify-center w-full h-full p-3">
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
      <div className="flex"></div>
    </div>
  );
}
