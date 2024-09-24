import { tool } from "@langchain/core/tools";
import { authSchema } from "@/ai-tools/schema";

const { IDP_USER, IDP_PASS, DID, IDP_URL } = process.env;
const endpoint = IDP_URL;
const did = DID;

export const authTool = tool(
  async () => {
    try {
      // Add basic Auth
      const headers = new Headers();
      headers.append(
        "authorization",
        `Basic ${Buffer.from(`${IDP_USER}:${IDP_PASS}`).toString("base64")}`,
      );
      const identity = await fetch(`${endpoint}?did=${did}`, {
        headers,
      });
      return identity.json();
    } catch (err) {
      return {
        message:
          "An error happened. let the user know you can not retrieve the identity",
      };
    }
  },
  {
    name: "authenticate",
    description:
      "This tool is used to authenticate the identity of the agent. When asked about who or what the AI assistant agent is, it triggers a secure response that verifies the identity of the AI assistant agent and returns a json file with its identity information that can be  presented to the User in the chat.",
    schema: authSchema,
  },
);
