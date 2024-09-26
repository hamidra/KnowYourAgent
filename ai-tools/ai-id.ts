import { tool } from "@langchain/core/tools";
import { authSchema } from "@/ai-tools/schema";

const { IDP_USER, IDP_PASS, DID, IDP_URL } = process.env;
const endpoint = IDP_URL;
const did = DID && encodeURIComponent(DID);
export const authTool = tool(
  async () => {
    try {
      // Add basic Auth
      const getDIDUrl = `${endpoint}?did=${did}`;
      console.info(getDIDUrl);
      const headers = {
        authorization: `Basic ${Buffer.from(`${IDP_USER}:${IDP_PASS}`).toString(
          "base64",
        )}`,
      };
      const request = new Request(getDIDUrl, { headers });
      console.log(request);
      const response = await fetch(request);
      console.log(headers);
      console.info(response.headers);
      console.info();
      // Check if HTTP status is OK
      if (!response.ok) {
        const errorMessage = `Error: HTTP status ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Parse the result
      const result = await response.json();
      return result;
    } catch (err) {
      console.error(err);
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
