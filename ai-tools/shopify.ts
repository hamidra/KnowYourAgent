import { tool } from "@langchain/core/tools";
import { getShopifyProductsSchema } from "./schema";
import { getAuthURL } from "./utils/auth";

const { ACTION_API_ENDPOINT, DID } = process.env;

if (!DID || !ACTION_API_ENDPOINT) {
  throw new Error("DID or ACTION_API_ENDPOINT is not set");
}

export const shopifyTool = tool(
  async ({ limit }) => {
    // TODO: remove this once we have a real store name. for demo purposes we always use this store name
    const storeName = "tesser-test";

    const authEndpointURL = getAuthURL({
      provider: "shopify",
      resource: storeName,
      udid: DID,
    });
    const authAction = {
      url: authEndpointURL.toString(),
      metadata: {
        title: "Login to your Shopify Store",
        name: "shopify",
        description:
          "login to your Shopify Store to allow access to your store information",
        logo: "https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-shopping-bag-full-color-66166b2e55d67988b56b4bd28b63c271e2b9713358cb723070a92bde17ad7d63.svg",
        btnText: "Login to Shopify",
      },
    };

    // Action Endpoint URL
    const actionEndpointURL = new URL(
      `shopify/${storeName}/products`,
      ACTION_API_ENDPOINT,
    );

    const agentDID = DID;

    actionEndpointURL.searchParams.set("limit", limit.toString());
    // TODO: replace agentDID with userDID when we have the full user did in place
    actionEndpointURL.searchParams.set("udid", agentDID as string);

    const response = await fetch(actionEndpointURL);
    if (response.status === 401) {
      return { humanAction: authAction };
    } else if (response.status < 300) {
      const data = await response.json();
      return data;
    } else {
      console.error(response);
      return {
        error: "Something went wrong",
      };
    }
  },
  {
    name: "get_shopify_products",
    description: `This tool is used to fetch the user's products from their Shopify store.`,
    schema: getShopifyProductsSchema,
  },
);
