"use client";

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GlassCard } from './ui';

const FEATURES = [
  {
    title: "Immutable Blobs",
    description: "Every form submission is stored as a permanent, content-addressed blob on the Walrus Protocol. Your data is immutable and decentralized by default.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    color: "#cdb4ff"
  },
  {
    title: "Seal Encryption",
    description: "Protect sensitive community feedback with integrated Seal encryption. Only authorized team members can decrypt and read private submissions.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    color: "#e0f2fe"
  },
  {
    title: "AI-Powered Insights",
    description: "Analyze thousands of submissions in seconds. Our integrated AI summarizes feedback, identifies trends, and calculates average ratings automatically.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M12 22v-10" />
        <path d="M12 8v-2" />
      </svg>
    ),
    color: "#fae8ff"
  },
  {
    title: "Incentivized Forms",
    description: "Reward your community for their time. Lock SUI rewards into your forms and let users claim them instantly upon successful submission.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    color: "#dcfce7"
  },
  {
    title: "On-Chain Team Work",
    description: "Manage submissions together. Invite team members by wallet address to read encrypted data, add notes, and update status on-chain.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#fef08a"
  },
  {
    title: "Export CSV/JSON",
    description: "Take your data anywhere. Export all submissions to standard CSV or JSON formats with a single click for deeper analysis in your favorite tools.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    color: "#e0f2fe"
  },
  {
    title: "Rich Media Forms",
    description: "Build beautiful forms with support for rich text, dropdowns, star ratings, and direct file/video uploads to Walrus.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    color: "#fed7aa"
  },
  {
    title: "No Middleman",
    description: "Say goodbye to centralized servers and data siloes. Worm connects you directly to your community through a transparent, on-chain feedback loop.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "#dcfce7"
  }
];

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="bg-[#cdb4ff]/20 text-[#4a2e8c] text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-6 border border-[#cdb4ff]/30"
          >
            Core Infrastructure
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-syne font-extrabold text-black tracking-tight mb-8">
            { "Built for the Future.".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                className="inline-block mr-4"
              >
                {word}
              </motion.span>
            ))}
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl text-black/50 font-jakarta font-medium max-w-2xl leading-relaxed"
          >
            Verifiable, immutable, and decentralized feedback infrastructure built on the Walrus Protocol. 
            Securely collect high-integrity sessions directly from your community.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {FEATURES.map((feature, i) => (
            <motion.div key={i} variants={itemVariants}>
              <GlassCard className="h-full !p-12 !rounded-[48px] !bg-white/60 border-white hover:!bg-white transition-all group shadow-xl hover:shadow-2xl">
                <div 
                  className="w-16 h-16 rounded-3xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg"
                  style={{ backgroundColor: feature.color + '33', color: '#4a2e8c' }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-syne font-extrabold mb-4 text-black group-hover:text-[#4a2e8c] transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-jakarta font-medium text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-10 flex items-center gap-2 text-[10px] font-bold text-[#4a2e8c] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  Learn More 
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
