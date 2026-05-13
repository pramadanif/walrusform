"use client";

import React, { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

const TEMPLATES = [
  { id: 'bug', name: 'Bug Report', desc: 'Collect detailed technical issues with screenshot support.', fields: 6, icon: <BugIcon /> },
  { id: 'feature', name: 'Feature Request', desc: 'Gather structured ideas from your community.', fields: 4, icon: <ZapIcon /> },
  { id: 'survey', name: 'Community Survey', desc: 'Get to know your community demographics.', fields: 12, icon: <UsersIcon /> },
  { id: 'dao', name: 'DAO Governance', desc: 'Feedback on active proposals and treasury.', fields: 8, icon: <BoxIcon /> },
  { id: 'nft', name: 'NFT Drop Feedback', desc: 'Collect sentiment after your recent mint.', fields: 5, icon: <StarIcon /> },
  { id: 'retro', name: 'Team Retrospective', desc: 'Internal feedback for sprint cycles.', fields: 7, icon: <ClockIcon /> },
  { id: 'grant', name: 'Grant Application', desc: 'Structured intake for ecosystem grants.', fields: 15, icon: <CoinsIcon /> },
  { id: 'onboard', name: 'Onboarding Info', desc: 'Collect initial data from new users.', fields: 10, icon: <ClipboardIcon /> },
];

export default function TemplatesPage() {
  const [filter, setFilter] = useState('All');
  const router = useRouter();

  return (
    <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
      <AppBackground />
      <Navbar />

      {/* Proporsional Mascot (Peeking from top right) */}
      <div className="fixed top-24 -right-12 w-56 h-56 opacity-15 pointer-events-none z-0">
        <Image src="/alkimi-hero.avif" alt="Mascot" fill className="object-contain" />
      </div>

      <main className="max-w-[1400px] mx-auto px-8 pt-32 pb-20 relative z-10">
        <div className="mb-16">
          <h1 className="text-6xl font-outfit font-bold mb-4 tracking-tight">Templates</h1>
          <p className="text-gray-500 font-jakarta font-bold text-lg">Pick a blueprint to start your session.</p>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-16 overflow-x-auto pb-4 scrollbar-hide">
          {['All', 'Bug Reports', 'Feature Requests', 'Surveys', 'DAO', 'Product Feedback'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3 rounded-full font-jakarta font-bold text-[14px] whitespace-nowrap transition-all duration-300 ${
                filter === f ? 'bg-black text-white shadow-xl scale-105' : 'bg-white/80 border border-black/5 text-gray-500 hover:text-black shadow-sm'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard className="h-full flex flex-col group cursor-pointer hover:!border-black/20 !bg-white/95 !rounded-[40px] border-white shadow-lg hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="mb-8 w-16 h-16 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center text-black group-hover:scale-110 transition-transform duration-500">
                  {t.icon}
                </div>
                <h3 className="text-xl font-outfit font-bold mb-3 group-hover:text-black transition-colors">{t.name}</h3>
                <p className="text-gray-500 font-jakarta font-bold text-[14px] mb-8 flex-grow leading-relaxed">{t.desc}</p>
                
                <div className="flex items-center justify-between pt-8 border-t border-black/[0.03]">
                  <div className="bg-black/5 px-4 py-1.5 rounded-full">
                    <span className="font-jakarta font-bold text-[11px] text-black/60 uppercase tracking-widest">{t.fields} fields</span>
                  </div>
                  <button onClick={() => router.push('/builder')} className="text-black font-outfit font-bold text-[15px] hover:underline transition-all">
                    Use →
                  </button>
                </div>

                <div className="absolute -bottom-6 -right-6 w-20 h-20 opacity-0 group-hover:opacity-10 transition-all duration-700">
                  <Image src="/wal-footer.avif" alt="Mascot" fill className="object-contain" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Icons (Same as before but consistent)
const BugIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 7V3m0 0l-3 3m3-3l3 3M12 7l4 4m-4-4l-4 4m4-4v14m0 0l-3-3m3 3l3-3"/></svg>;
const ZapIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const UsersIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
const BoxIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
const StarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>;
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const CoinsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M18 8c0 4.418-4.477 8-10 8"/><circle cx="16" cy="16" r="6"/></svg>;
const ClipboardIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 3h6v4H9z"/></svg>;
