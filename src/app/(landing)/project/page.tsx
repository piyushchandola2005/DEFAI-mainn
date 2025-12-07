import React from 'react';

const Page = () => {
  return (
    <div className="container p-6 max-w-3xl mx-auto h-screen">
      <h1 className="text-3xl font-bold mb-4">DEFAI Project</h1>
      
      <p className="mt-6">
        The primary objective of the DEFAI project is to fundamentally re-engineer the user experience of decentralized finance (DeFi), lowering the steep learning curve that currently prevents mainstream adoption. This will be achieved by creating an intuitive, AI-powered conversational interface that serves as a user's single point of entry into the complex DeFi ecosystem.
      </p>
      
      <p className="mt-4">
        By enabling users to execute operations using simple, natural language processing (NLP), the project aims to abstract away the underlying technical friction—such as managing contract addresses, understanding gas fees, and navigating fragmented protocols. Furthermore, the platform will provide real-time, comprehensive portfolio management through a unified UI, replacing the need for multiple tracking tools.
      </p>
      
      <p className="mt-4">
        The project will also focus on simplifying and securing common transactions, such as token swaps and transfers, by integrating features like best-price routing and risk simulation. Ultimately, DEFAI aims to not only act as a tool but also as an educational guide, helping to onboard new users safely and confidently, thereby democratizing access to decentralized financial services.
      </p>
    </div>
  );
};

export default Page;
