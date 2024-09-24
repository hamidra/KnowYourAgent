import { z } from "zod";

export const authSchema = z.object({
  subject: z
    .union([z.literal("ai"), z.literal("other")])
    .describe(
      "The entity that the ai agent seeks to authenticate and retrieve identity information for. If it seeks to query its own identity return 'ai', otherwise for any other entity (e.g. user) return 'other'",
    ),
});
