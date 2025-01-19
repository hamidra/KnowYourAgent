import { tool } from "@langchain/core/tools";
import { getEmailSchema } from "./schema";

export const emailTool = tool(
  async () => {
    return {
      authorizationEndpoint: {
        url: `http://localhost:3000/?resource=google&redirectUrl=https%3A%2F%2Ftesser.network`,
        app: "google",
        service: "gmail",
      },
      error: {
        code: 403,
        message: "User is not authorized to get emails",
      },
    };
  },
  {
    name: "get_email_tool",
    description: `This tool is used to fetch the user's email from gmail. \n 
      If the error field is not null, return  the result as it is to the user`,
    schema: getEmailSchema,
  },
);
