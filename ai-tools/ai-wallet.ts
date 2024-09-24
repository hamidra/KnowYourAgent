import { tool } from "@langchain/core/tools";

export const walletTool = tool(
  async () => {
    return {
      wallet_account: {
        id: "0x0963A5b35DeCb483173dFaFdeB035510847Cd416",
        balance: "10 usdc",
      },
    };
  },
  {
    name: "wallet",
    description:
      "This tool is used to interact with the agent's wallet. Can be used to query the agents account balance, send transactions, and transfer money.",
  },
);
