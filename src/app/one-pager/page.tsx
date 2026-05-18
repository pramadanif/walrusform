"use client";

import React, { useState, useEffect } from 'react';
import AppBackground from '@/components/AppBackground';
import Navbar from '@/components/Navbar';
import { Button, GlassCard } from '@/components/ui';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OnePagerPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-[#cdb4ff] selection:text-[#4a2e8c] relative overflow-x-hidden">
      <AppBackground />
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────
          HERO SECTION (Matches landing page style exactly)
          ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] w-full flex flex-col items-center justify-center pt-32 pb-20 px-4 overflow-hidden z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto"
        >
          {/* Badge using landing page colors */}
          <div className="bg-[#cdb4ff] text-[#4a2e8c] text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-8 shadow-sm font-jakarta">
            Walrus Sessions Hackathon Submission
          </div>
          
          <h1 className="text-[4.5rem] md:text-[7rem] leading-[0.9] font-syne font-extrabold tracking-[-0.05em] mb-8 text-black max-w-5xl mx-auto">
            Worm<span className="text-[#4a2e8c]">.</span>
          </h1>

          <p className="text-[20px] md:text-[24px] text-black/60 font-jakarta font-medium tracking-tight max-w-[850px] leading-relaxed mb-12">
            The high-fidelity primitives needed for permanent, transparent, and secure community coordination on the Walrus Protocol.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/builder">
              <Button className="!px-12 !py-6 !text-[20px] shadow-2xl">
                Launch App
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="!px-12 !py-6 !text-[20px] border-black/10 hover:bg-black/5 transition-colors">
                GitHub
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          THE PROBLEM & THE SOLUTION (Dark Section like InfoSection)
          ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#050505] text-white pt-32 pb-32 relative -mt-10 rounded-t-[3rem] z-30">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#1a1a1a] to-transparent rounded-t-[3rem] pointer-events-none"></div>
        
        <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10 space-y-32">
          
          {/* Row 1: The Problem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
            <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg font-syne font-extrabold">
              The Problem: Web2 Forms in a Web3 World
            </h2>
            <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex flex-col items-start max-w-xl font-jakarta">
              <p>
                Web3 teams still rely on Google Forms and Airtable to collect bug reports, surveys, and feedback. These centralized platforms create single points of failure, risk censoring sensitive data, and provide no native mechanism to reward contributors on-chain. There is no trustless way to ensure data integrity or enforce access control without middle-men.
              </p>
            </div>
          </div>

          {/* Row 2: The Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
            <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg font-syne font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#cdb4ff] to-purple-400">
              The Solution: A Native Feedback Protocol
            </h2>
            <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex flex-col items-start max-w-xl font-jakarta">
              <p>
                Worm is a sovereign feedback system. Form definitions and submissions are stored as immutable blobs directly on the <strong className="text-white">Walrus Protocol</strong>. Access control and team permissions are enforced by the <strong className="text-white">Sui Blockchain</strong>. Private data is end-to-end encrypted using the <strong className="text-white">@mysten/seal</strong> library, ensuring that only authorized team members hold the keys to read sensitive submissions.
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          STAR FEATURE: INCENTIVES (Highlighted Standalone Section)
          ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#050505] text-white pb-32 relative z-30">
        <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10">
          <div className="border border-[#4a2e8c]/30 rounded-[2rem] p-10 md:p-16 bg-gradient-to-br from-[#4a2e8c]/10 to-transparent relative overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4a2e8c] opacity-20 blur-[150px] rounded-full pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10 items-center">
              <div>
                <div className="text-[12px] font-jakarta font-bold text-[#cdb4ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#cdb4ff] animate-pulse"></span>
                  Star Feature
                </div>
                <h3 className="text-4xl md:text-5xl font-syne font-extrabold mb-6 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white to-[#cdb4ff]">
                  Incentivized Forms via Move Escrow
                </h3>
                <p className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium font-jakarta mb-6">
                  Lock SUI tokens into an on-chain escrow pool when creating a form. Every user who completes it can claim a reward instantly — a feature fundamentally impossible to build natively in Google Forms or Typeform.
                </p>
                <div className="text-sm font-jakarta text-white/50 border border-white/10 inline-block px-4 py-2 rounded-full bg-white/5">
                  Powered by custom <strong className="text-white">worm.move</strong> contract on Sui Testnet
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-[1.5rem] p-8 backdrop-blur-md">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#4a2e8c] text-white flex items-center justify-center font-bold font-syne flex-shrink-0">1</div>
                    <div>
                      <div className="text-lg font-bold font-syne text-white">Creator locks SUI</div>
                      <div className="text-sm text-[#a0a0a0] font-jakarta mt-1">SUI tokens locked into a secure escrow pool.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#4a2e8c] text-white flex items-center justify-center font-bold font-syne flex-shrink-0">2</div>
                    <div>
                      <div className="text-lg font-bold font-syne text-white">User fills form</div>
                      <div className="text-sm text-[#a0a0a0] font-jakarta mt-1">Completes form, blob securely stored on Walrus.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#4a2e8c] text-white flex items-center justify-center font-bold font-syne flex-shrink-0">3</div>
                    <div>
                      <div className="text-lg font-bold font-syne text-white">Instant Claim</div>
                      <div className="text-sm text-[#a0a0a0] font-jakarta mt-1">One-click unlocks SUI reward directly to user&apos;s wallet.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          CORE FEATURES (Grid Section like FeaturesSection)
          ────────────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gray-50 relative overflow-hidden z-20 rounded-t-[3rem] -mt-10">
        <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10">
          
          <div className="text-center mb-24 flex flex-col items-center">
            <div className="text-[10px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em] mb-4">
              Core Infrastructure
            </div>
            <h2 className="text-5xl md:text-6xl font-syne font-extrabold text-black tracking-tight mb-8">
              Everything You Need,<br />Fully Onchain.
            </h2>
            <p className="text-[18px] text-black/60 font-jakarta max-w-3xl">
              Worm leverages cutting-edge Web3 primitives to deliver a seamless, secure, and decentralized user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feat 1: Walrus */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">Walrus Protocol Storage</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                We use the <strong className="text-black">Walrus Protocol</strong> to store JSON form definitions and heavy media submissions (videos, screenshots). Submissions are registered as content-addressed blobs, ensuring data immutability and censorship resistance without high on-chain gas costs.
              </p>
            </GlassCard>

            {/* Feat 2: Seal */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">Seal End-to-End Encryption</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                Leveraging the <strong className="text-black">@mysten/seal</strong> library, sensitive responses (like user emails or private bug details) are encrypted on the client side before upload. Only authorized wallets specified in the form&apos;s team registry possess the cryptographic keys to decrypt this data in the dashboard.
              </p>
            </GlassCard>

            {/* Feat 3: AI Analysis */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22v-10"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">AI Insights Engine</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                Worm integrates <strong className="text-black">OpenRouter</strong> and the <strong className="text-black">google/gemini-2.0-flash-thinking-exp</strong> model to parse and synthesize raw feedback. The dashboard automatically generates action items, categorizes sentiment, and summarizes complex community responses in seconds.
              </p>
            </GlassCard>
            
            {/* Feat 4: Sui Registry */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">Sui Object Registry</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                Instead of a centralized database to map users to forms, Worm utilizes <strong className="text-black">Sui Objects</strong> as a decentralized registry. Form ownership, team memberships, and submission indices are tracked transparently on the Sui blockchain ledger.
              </p>
            </GlassCard>

            {/* Feat 5: Rich Media */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">Rich Media Forms</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                Our builder supports rich text, dropdowns, star ratings, and direct file uploads. When a user uploads a video or screenshot, it is pushed directly to the Walrus network, creating a high-fidelity feedback loop for developers.
              </p>
            </GlassCard>

            {/* Feat 6: Data Export */}
            <GlassCard className="!bg-white p-10 flex flex-col items-start border-black/5 hover:border-[#cdb4ff] hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-[#cdb4ff]/20 flex items-center justify-center mb-6 text-[#4a2e8c] group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <h3 className="text-2xl font-bold font-syne text-black mb-3">Data Export CSV</h3>
              <p className="text-black/60 font-jakarta leading-relaxed text-sm">
                Download all submissions in standard formats (CSV) for deep analysis in any external tool. This ensures interoperability with your existing data pipelines while maintaining on-chain integrity.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          JUDGES' REQUIREMENT: PRIVATE ADMIN DASHBOARD
          ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#050505] text-white pt-32 pb-32 relative z-30 rounded-t-[3rem] -mt-10">
        <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10">
          
          <div className="text-center mb-16 flex flex-col items-center">
            <div className="text-[12px] font-jakarta font-bold text-[#cdb4ff] uppercase tracking-[0.2em] mb-4">
              Hackathon Criteria
            </div>
            <h2 className="text-4xl md:text-5xl font-syne font-extrabold text-white mb-6">
              Private Admin Dashboard
            </h2>
            <p className="text-[17px] text-[#a0a0a0] font-jakarta max-w-2xl text-center">
              Judges required a private dashboard to review, filter, and prioritize feedback. Worm delivers this natively with complete cryptographic security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-syne text-white">Review &amp; Decrypt</h4>
                  <p className="text-[#a0a0a0] font-jakarta text-sm mt-1">Admins can see all submissions. Encrypted fields are automatically decrypted in real-time if the connected wallet has permission via Seal.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-syne text-white">Filter &amp; Search</h4>
                  <p className="text-[#a0a0a0] font-jakarta text-sm mt-1">Full-text search across decrypted submissions and filtering by specific form IDs to isolate critical feedback instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-syne text-white">Prioritize &amp; Note</h4>
                  <p className="text-[#a0a0a0] font-jakarta text-sm mt-1">Update submission statuses (New, In Review, Actioned, Archived) and save internal admin notes directly to the Sui blockchain.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-syne text-white">Data Export</h4>
                  <p className="text-[#a0a0a0] font-jakarta text-sm mt-1">One-click CSV generation to export structured feedback for offline analysis or team reporting.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md">
              <div className="text-center">
                <div className="text-5xl font-syne font-extrabold text-[#cdb4ff] mb-2">100%</div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0] mb-4">Criteria Compliant</div>
                <p className="text-sm text-[#a0a0a0] font-jakarta leading-relaxed">
                  Every requested dashboard feature — filtering, notes, prioritization, exporting, and AI analysis — has been successfully implemented and tested on the Sui Testnet.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-black/10 py-12 relative z-30">
        <div className="max-w-[1400px] w-full mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-syne font-extrabold text-2xl text-black">
            worm<span className="text-[#4a2e8c]">.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="text-sm text-black/60 hover:text-black font-jakarta font-semibold transition-colors">Home</Link>
            <Link href="/builder" className="text-sm text-black/60 hover:text-black font-jakarta font-semibold transition-colors">Builder</Link>
            <Link href="/dashboard" className="text-sm text-black/60 hover:text-black font-jakarta font-semibold transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
