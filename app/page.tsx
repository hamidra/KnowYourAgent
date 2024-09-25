import { ChatWindow } from "@/components/ChatWindow";

export default function AgentsPage() {
  const InfoCard = (
    <div className="p-4 md:p-8 border-2 rounded-3xl w-full max-h-[85%] overflow-hidden">
      <h1 className="text-3xl md:text-6xl mb-4">▲ Know Your Agent</h1>
      <p className="text-2xl font-light">
        This agent has been verified and the owner has issued a verifiable
        credential so the Agent can accomplish tasks on their behalf.
        <br />
        It is also equipped with a wallet with some balance that they can use
        for online payments in case they need a payment for a task.
        <br />
        <br />
        Try to ask it about it&apos;s identity or their account balance. e.g.
        ask them.
        <br />
        &gt; Who you are?! Provide me a proof of your Identity?
        <br />
        &gt; What is your current balance?!
      </p>
    </div>
  );
  return (
    <ChatWindow
      endpoint="api/chat/agents"
      emptyStateComponent={InfoCard}
      placeholder="Hi! Ask me about myself, my identity, how much money I have! Ask me about anything!"
      titleText="Know Your Agent."
      emoji="🤖"
      showIntermediateStepsToggle={true}
    ></ChatWindow>
  );
}
