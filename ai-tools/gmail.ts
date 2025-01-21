import { tool } from "@langchain/core/tools";
import { getEmailSchema } from "./schema";
import { url } from "inspector";

const { ACTION_API_ENDPOINT, DID } = process.env;
const actionEndpointURL = new URL("google/gmail/messages", ACTION_API_ENDPOINT);
const authRedirectURL = encodeURIComponent("http:localhost:3001");
const agentDID = encodeURIComponent(DID as string);

const authAction = {
  url: `http://localhost:3000/?resource=google&redirectUrl=${authRedirectURL}&udid=${agentDID}`,
  metadata: {
    title: "Login to Gmail",
    name: "gmail",
    description:
      "login to your gmail account to allow access to your gmail box, so I can fetch your emails for you",
    logo: "https://lh3.googleusercontent.com/0rpHlrX8IG77awQMuUZpQ0zGWT7HRYtpncsuRnFo6V3c8Lh2hPjXnEuhDDd-OsLz1vua4ld2rlUYFAaBYk-rZCODmi2eJlwUEVsZgg",
    btnText: "Login to Gmail",
  },
};

export const emailTool = tool(
  async ({ limit }) => {
    actionEndpointURL.searchParams.set("limit", limit.toString());
    actionEndpointURL.searchParams.set("udid", agentDID as string);
    const response = await fetch(actionEndpointURL);
    if (response.status === 401) {
      return { humanAction: authAction };
    } else if (response.status < 300) {
      const data = await response.json();
      console.info(data);
      return JSON.stringify(
        data.map((email: any, i: number) => ({
          index: i,
          snippent: email.snippet,
        })),
      );
    } else {
      console.error(response);
      return {
        error: "Something went wrong",
      };
    }
  },
  {
    name: "get_email_tool",
    description: `This tool is used to fetch the user's email from gmail.`,
    schema: getEmailSchema,
  },
);
