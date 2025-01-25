import { z } from "zod";

export const authSchema = z.object({
  subject: z
    .union([z.literal("ai"), z.literal("other")])
    .describe(
      "The entity that the ai agent seeks to authenticate and retrieve identity information for. If it seeks to query its own identity return 'ai', otherwise for any other entity (e.g. user) return 'other'",
    ),
});

export const getEmailSchema = z.object({
  limit: z.number().default(10).describe("maximum number of emails to return"),
});

export const getShopifyProductsSchema = z.object({
  storeName: z
    .string()
    .describe("the name of the store to fetch products from"),
  limit: z
    .number()
    .default(10)
    .describe("maximum number of products to return"),
});
