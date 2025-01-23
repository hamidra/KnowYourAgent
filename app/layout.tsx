import "./globals.css";
import { Public_Sans } from "next/font/google";

import { PrivyProvider } from '../providers/PrivyProvider';
import Header from "@/components/Header";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Know Your Agent Playground</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Proof of concept playground showing how to interact with a KYA'd AI Agent "
        />
        <meta property="og:title" content="Know Your Agent Playground" />
        <meta
          property="og:description"
          content="Starter template showing how to use LangChain in Next.js projects. See source code and deploy your own at https://github.com/langchain-ai/langchain-nextjs-template!"
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Know Your Agent Playground" />
        <meta
          name="twitter:description"
          content="Starter template showing how to use LangChain in Next.js projects. See source code and deploy your own at https://github.com/langchain-ai/langchain-nextjs-template!"
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <PrivyProvider>
          <div className="flex flex-col min-h-[100vh]">
            <Header />
            <div className="flex-1 flex-col relative">
              {children}
            </div>
          </div>
        </PrivyProvider>
      </body>
    </html>
  );
}
