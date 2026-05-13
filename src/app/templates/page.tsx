"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge } from '@/components/ui';
import Navbar from '@/components/Navbar';
import AppBackground from '@/components/AppBackground';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const TEMPLATES = [
  {
    id: 'feedback',
    title: 'Community Feedback',
    description: 'Collect structured feedback from your protocol users or DAO members.',
    icon: '💬',
    color: '#cdb4ff',
    fields: 5,
    tag: 'Popular'
  },
  {
    id: 'grant',
    title: 'Grant Application',
    description: 'A comprehensive form for builders applying for ecosystem grants.',
    icon: '🏗️',
    color: '#e0f2fe',
    fields: 12,
    tag: 'New'
  },
  {
    id: 'bug-report',
    title: 'Bug Report',
    description: 'Standardized bug reporting with screenshot and video support.',
    icon: '🐞',
    color: '#dcfce7',
    fields: 6,
    tag: 'Utility'
  },
  {
    id: 'survey',
    title: 'Market Survey',
    description: 'Understand your audience with deep analytics-ready surveys.',
    icon: '📊',
    color: '#fae8ff',
    fields: 15,
    tag: 'Deep'
  },
  {
    id: 'event',
    title: 'Event Registration',
    description: 'Perfect for hackathons, workshops, and community meetups.',
    icon: '🎟️',
    color: '#f5f3ff',
    fields: 8,
    tag: 'Social'
  },
  {
    id: 'whitelist',
    title: 'Whitelist Signup',
    description: 'Manage early access and exclusive community drops securely.',
    icon: '🦄',
    color: '#ecfeff',
    fields: 4,
    tag: 'DeFi'
  }
];

export default function TemplatesPage() {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
      <AppBackground />
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-8 pt-44 pb-20 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#cdb4ff] text-[#4a2e8c] text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-6 shadow-sm"
          >
            Start faster with templates
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-syne font-extrabold text-black mb-6 tracking-tight"
          >
            Form Gallery
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[18px] md:text-[22px] text-black/60 font-jakarta font-medium max-w-2xl"
          >
            Choose from a variety of pre-built decentralized forms or start from scratch.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {TEMPLATES.map((template) => (
            <motion.div key={template.id} variants={item}>
              <GlassCard className="h-full flex flex-col group !p-10 !rounded-[48px] hover:border-[#4a2e8c]/30">
                <div className="flex justify-between items-start mb-8">
                  <div 
                    className="w-16 h-16 flex items-center justify-center rounded-[24px] text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: `${template.color}50` }}
                  >
                    {template.icon}
                  </div>
                  <Badge color={template.tag === 'Popular' ? 'purple' : template.tag === 'New' ? 'green' : 'blue'}>
                    {template.tag}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-outfit font-bold mb-4 group-hover:text-[#4a2e8c] transition-colors">
                  {template.title}
                </h3>
                <p className="text-gray-500 font-jakarta text-[15px] leading-relaxed mb-10 flex-1">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 font-jakarta font-bold text-[10px] uppercase tracking-widest">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    {template.fields} Fields
                  </div>
                  <Button 
                    variant="ghost" 
                    className="!py-2 !px-5 !text-[12px] group-hover:!bg-[#4a2e8c] group-hover:!text-white transition-all"
                    onClick={() => router.push('/builder')}
                  >
                    Use This
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Create Custom Card */}
          <motion.div variants={item}>
            <div 
              onClick={() => router.push('/builder')}
              className="h-full flex flex-col items-center justify-center text-center p-10 rounded-[48px] border-4 border-dashed border-[#cdb4ff]/40 bg-white/30 backdrop-blur-sm cursor-pointer hover:bg-white/50 hover:border-[#4a2e8c]/40 transition-all group"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <svg className="text-[#4a2e8c]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <h3 className="text-2xl font-outfit font-bold mb-3">Custom Session</h3>
              <p className="font-jakarta text-gray-400 text-sm max-w-[200px]">Start with a blank canvas and build exactly what you need.</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
