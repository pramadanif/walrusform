"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import AppBackground from '@/components/AppBackground';
import Navbar from '@/components/Navbar';

const DOCS_CONTENT: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
  "custom-forms": {
    title: "Custom Forms Onchain",
    subtitle: "Deep dive into our decentralized form infrastructure.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Worm allows you to build complex forms with rich text, dropdowns, star ratings, and file uploads. 
          Every form definition is stored as a JSON blob on the Walrus Protocol, making it permanent and immutable.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Storage</strong>: Walrus Protocol (via HTTP Aggregator API) for storing large JSON files.</li>
          <li><strong>Blockchain</strong>: Sui Mainnet for anchoring form indices and access controls.</li>
          <li><strong>SDK</strong>: <code>@mysten/sui</code> and <code>@mysten/dapp-kit</code> for wallet connections and transaction execution.</li>
        </ul>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Technical Architecture</h3>
        <p>
          When you create a form, the layout is serialized to JSON and uploaded to Walrus. The generated Blob ID is then registered on the Sui blockchain via a smart contract.
        </p>
      </div>
    )
  },
  "security": {
    title: "Admin Dashboard & Security",
    subtitle: "Learn how we protect sensitive community feedback.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Privacy is our top priority. Worm uses advanced cryptography to ensure that sensitive feedback 
          remains confidential and accessible only to authorized team members.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Encryption</strong>: <code>@mysten/seal</code> library for end-to-end encryption.</li>
          <li><strong>Key Management</strong>: Seal Key Server on Sui Mainnet for secure key exchange.</li>
        </ul>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Seal Cryptography</h3>
        <p>
          We utilize Seal cryptography to encrypt form submissions before they are uploaded to Walrus. 
          This ensures that even though the data is stored on a public network, only authorized keys can read it.
        </p>
      </div>
    )
  },
  "immutable-blobs": {
    title: "Immutable Blobs",
    subtitle: "Permanent data storage on Walrus.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Every form submission is stored as a content-addressed blob on the Walrus Protocol. 
          This means the data cannot be altered or deleted, ensuring complete transparency and verifiability.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Protocol</strong>: Walrus Protocol for decentralized storage.</li>
          <li><strong>Data Type</strong>: Erasure-coded blobs for high availability and fault tolerance.</li>
        </ul>
      </div>
    )
  },
  "seal-encryption": {
    title: "Seal Encryption",
    subtitle: "End-to-end encryption for sensitive data.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Protect sensitive community feedback with integrated Seal encryption. 
          Only authorized team members can decrypt and read private submissions.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>SDK</strong>: <code>@mysten/seal</code> for client-side encryption and decryption.</li>
          <li><strong>Mechanism</strong>: Symmetric encryption for data, with keys wrapped using Seal's threshold cryptography.</li>
        </ul>
      </div>
    )
  },
  "ai-insights": {
    title: "AI-Powered Insights",
    subtitle: "Automated analysis of submissions.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Analyze thousands of submissions in seconds. Our integrated AI summarizes feedback, 
          identifies trends, and calculates average ratings automatically.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>API</strong>: OpenRouter API for accessing leading AI models.</li>
          <li><strong>Model</strong>: <code>google/gemini-2.0-flash-thinking-exp</code> for fast and deep analysis.</li>
          <li><strong>Implementation</strong>: Custom prompt engineering to parse structured JSON submissions and output a clean summary.</li>
        </ul>
      </div>
    )
  },
  "incentivized-forms": {
    title: "Incentivized Forms",
    subtitle: "Reward your community for their feedback.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Reward your community for their time. Lock SUI rewards into your forms and 
          let users claim them instantly upon successful submission.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Smart Contract</strong>: Sui Move custom module (<code>worm.move</code>).</li>
          <li><strong>Mechanism</strong>: Escrow pools that lock SUI and release them when a valid submission is proven.</li>
          <li><strong>Validation</strong>: On-chain check of submission limits and pool balance.</li>
        </ul>
      </div>
    )
  },
  "team-work": {
    title: "On-Chain Team Work",
    subtitle: "Collaborate securely with your team.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Manage submissions together. Invite team members by wallet address to read encrypted data, 
          add notes, and update status on-chain.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Collaboration</strong>: Sui Shared Objects to store team registry.</li>
          <li><strong>Discovery</strong>: Sui Event indexing to find forms belonging to a team.</li>
        </ul>
      </div>
    )
  },
  "export-data": {
    title: "Export CSV/JSON",
    subtitle: "Take your data anywhere.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Take your data anywhere. Export all submissions to standard CSV or JSON formats 
          with a single click for deeper analysis in your favorite tools.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Export</strong>: Custom frontend parser to convert JSON answers into a table format.</li>
          <li><strong>Download</strong>: Native browser <code>Blob</code> and <code>URL.createObjectURL</code> for generating downloadable files on the fly.</li>
        </ul>
      </div>
    )
  },
  "rich-media": {
    title: "Rich Media Forms",
    subtitle: "Build beautiful forms with rich content.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Build beautiful forms with support for rich text, dropdowns, star ratings, 
          and direct file/video uploads to Walrus.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>UI</strong>: Custom components with TailwindCSS.</li>
          <li><strong>Rich Text</strong>: DOMPurify for sanitizing HTML inputs before rendering.</li>
          <li><strong>Uploads</strong>: Native <code>fetch</code> to PUT files directly to the Walrus publisher endpoint.</li>
        </ul>
      </div>
    )
  },
  "no-middleman": {
    title: "No Middleman",
    subtitle: "Direct peer-to-peer feedback.",
    content: (
      <div className="space-y-8 text-gray-700 font-jakarta">
        <p>
          Say goodbye to centralized servers and data siloes. Worm connects you directly 
          to your community through a transparent, on-chain feedback loop.
        </p>
        <h3 className="text-2xl font-syne font-extrabold text-black mt-12 mb-4">Libraries & Protocols</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li><strong>Architecture</strong>: Serverless frontend interacting directly with Sui RPC and Walrus Aggregators.</li>
          <li><strong>Benefit</strong>: Zero backend maintenance, zero server costs, and zero single points of failure.</li>
        </ul>
      </div>
    )
  }
};

export default function DocsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const doc = DOCS_CONTENT[slug];

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black">
        <AppBackground />
        <div className="text-center">
          <h1 className="text-4xl font-syne font-extrabold mb-4">404</h1>
          <p className="text-gray-500 mb-8">Document not found.</p>
          <Link href="/">
            <Button variant="purple">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black relative overflow-hidden">
      <AppBackground />
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-8 pt-32 pb-32 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-12 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Home
        </Link>

        <h1 className="text-5xl md:text-6xl font-syne font-extrabold tracking-tight mb-4 text-black">
          {doc.title}
        </h1>
        <p className="text-xl text-gray-500 font-jakarta mb-16">
          {doc.subtitle}
        </p>

        <div className="glass-card !bg-white !rounded-[48px] p-12 border-black/5 shadow-xl">
          {doc.content}
        </div>
      </div>
    </div>
  );
}
