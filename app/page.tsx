"use client";

import { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import Authenticated from "@/components/Authenticated";

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const InfoCard = (
    <div className="p-4 md:p-8 border-2 rounded-3xl w-full max-h-[85%] overflow-hidden">
      <h1 className="text-3xl md:text-6xl mb-4">▲ Know Your Agent</h1>
      <p className="text-2xl font-light">
        This agent has been verified and the owner has issued a verifiable
        credential so the Agent can accomplish tasks on their behalf.
        <br />
        It is also equipped with some tool set that can perform some tasks
        online, including a gmail tool for checking your latest emails on gmail,
        and an agent discovery tool that let it coordinate tasks with other
        agents in it's network.
        <br />
        <br />
        Try to ask it about it to coordinate some tasks. e.g. ask them.
        <br />
        &gt; Can you check my latest emails on my gmail?
        <br />
        &gt; Can you get a list of my top products from my shopify store? Store
        name is: tesser-test
      </p>
    </div>
  );

  return (
    isHydrated && (
      <Authenticated>
        <main
          className="flex h-screen flex-col items-center justify-between md:p-24 p-4
                        bg-neutral-100 text-neutral-800"
        >
          <ChatWindow
            endpoint="api/chat/agents"
            emptyStateComponent={InfoCard}
            placeholder="Hi! Ask me anything!"
            titleText="Know Your Agent."
            showIntermediateStepsToggle={true}
          ></ChatWindow>
        </main>
      </Authenticated>
    )
  );
}
