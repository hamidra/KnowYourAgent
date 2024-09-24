import { tool } from "@langchain/core/tools";
import { authSchema } from "@/ai-tools/schema";

export const authTool = tool(
  async () => {
    return {
      identity: {
        id: "0x0963A5b35DeCb483173dFaFdeB035510847Cd416",
        name: "AgentXEpq",
        DOB: "01-01-2024",
        certificate_url: "https://tesser.network/id",
      },
    };
  },
  {
    name: "authenticate",
    description:
      "This tool is used to authenticate the identity of the agent. When asked about who or what the agent is, it triggers a secure response that verifies the agent's identity using a pre-defined authentication method and returns an json file with Agent's identity information, e.g. id number, name, DOB,  that can be  presented to the User in the chat.",
    schema: authSchema,
  },
);
