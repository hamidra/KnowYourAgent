import { z } from "zod";

export const authSchema = z.object({
  subject: z
    .string()
    .describe(
      "The entity that the agent seeks to authenticate and retrieve identity information for.",
    ),
});
