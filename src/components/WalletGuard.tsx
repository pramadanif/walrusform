"use client";

import React from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import { GlassCard } from './ui';
import AppBackground from './AppBackground';
import Navbar from './Navbar';

export default function WalletGuard({ children }: { children: React.ReactNode }) {
  const account = useCurrentAccount();

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <AppBackground />
        <Navbar />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-[480px] w-full relative z-10"
        >
          <GlassCard className="!p-12 !bg-white/90 !rounded-[56px] border-white shadow-2xl text-center">
            <div className="w-24 h-24 bg-[#4a2e8c]/5 rounded-[32px] flex items-center justify-center mx-auto mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a2e8c" strokeWidth="2.5">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-syne font-extrabold mb-4 tracking-tight">Access Restricted</h2>
            <p className="text-gray-500 font-jakarta font-bold text-sm mb-10 leading-relaxed uppercase tracking-widest">Connect your Sui wallet to manage sessions and view responses.</p>
            
            <div className="flex justify-center">
              <ConnectButton className="!rounded-full !bg-black !text-white !font-outfit !font-bold !text-[15px] !px-10 !py-4 hover:!bg-black/80 transition-all !border-none !shadow-2xl" />
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
