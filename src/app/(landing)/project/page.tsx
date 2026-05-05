import React from 'react';

const Page = () => {
  return (
    <div className="container p-6 max-w-3xl mx-auto h-screen">
      <h1 className="text-3xl font-bold mb-4">DEFAI Project</h1>
      
      <p className="mt-6">
        The primary objective of the DEFAI project is to re-engineer the user experience of decentralized finance (DeFi), lowering the learning curve that prevents mainstream adoption. This is achieved through an intuitive, AI-powered conversational interface that acts as a single entry point into Solana trading—especially memecoins and SPL tokens—without juggling multiple dApp front ends.
      </p>
      
      <p className="mt-4">
        Users execute swaps (via Jupiter), transfers of SOL and SPL tokens, and portfolio checks using natural language. The assistant confirms risky actions before signing with Phantom, Solflare, or other supported wallets.
      </p>
      
      <p className="mt-4">
        The platform emphasizes safety: explicit mint addresses for illiquid pairs, clear slippage awareness, and transparent transaction previews on Solscan.
      </p>
    </div>
  );
};

export default Page;
