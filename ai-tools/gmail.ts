import { tool } from "@langchain/core/tools";
import { getEmailSchema } from "./schema";

export const emailTool = tool(
  async () => {
    return {
      humanAction: {
        url: `http://localhost:3000/?resource=google&redirectUrl=https%3A%2F%2Ftesser.network`,
        metadata: {
          title: "Login to Gmail",
          name: "gmail",
          description:
            "login to your gmail account to allow access to your gmail box, so I can fetch your emails for you",
          logo: "https://lh3.googleusercontent.com/0rpHlrX8IG77awQMuUZpQ0zGWT7HRYtpncsuRnFo6V3c8Lh2hPjXnEuhDDd-OsLz1vua4ld2rlUYFAaBYk-rZCODmi2eJlwUEVsZgg",
          btnText: "Login to Gmail",
        },
      },
    };
  },
  {
    name: "get_email_tool",
    description: `This tool is used to fetch the user's email from gmail.`,
    schema: getEmailSchema,
  },
);
