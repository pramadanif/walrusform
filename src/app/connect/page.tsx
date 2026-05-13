"use client";

import React, { useState, useEffect } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ConnectPage() {
  const [connecting, setConnecting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 15,
        y: (e.clientY / window.innerHeight - 0.5) * 15,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      router.push('/onboarding');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden bg-[#e6f0ff]">
      <AppBackground />
      
      {/* Decorative Floating Elements */}
      <div className="absolute top-20 left-[15%] w-12 h-12 bg-[#cdb4ff]/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-[15%] w-24 h-24 bg-[#00E5CC]/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="mb-12 text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#4a2e8c]/5 text-[#4a2e8c] px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.3em] uppercase mb-4 inline-block backdrop-blur-sm border border-[#4a2e8c]/10"
        >
          WALRUS SESSIONS
        </motion.div>
      </div>

      <div className="relative group/connect z-20">
        {/* The "Peeking" Walrus Asset */}
        <div 
          className="absolute -bottom-24 -right-20 w-48 h-48 z-0 pointer-events-none transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) group-hover/connect:-translate-y-8"
          style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)` }}
        >
          <Image 
            src="/alkimi-hero.avif" 
            alt="Walrus Mascot" 
            fill 
            className="object-contain"
          />
        </div>

        <GlassCard className="w-full max-w-[480px] text-center flex flex-col items-center relative z-10 !bg-white/80 border-white shadow-[0_32px_64px_rgba(31,38,135,0.1)] !rounded-[32px] overflow-hidden">
          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>

          <motion.div 
            className="mb-8 relative w-24 h-24 flex items-center justify-center"
            style={{ transform: `translate(${mousePos.x * -0.2}px, ${mousePos.y * -0.2}px)` }}
          >
            <div className="absolute inset-0 border-2 border-[#cdb4ff]/30 rounded-[30%] animate-spin-slow"></div>
            <div className="absolute inset-2 border border-[#4a2e8c]/10 rounded-[25%]"></div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#4a2e8c]">
              <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </motion.div>

          <h1 className="text-4xl font-outfit font-bold mb-4 text-black tracking-tight">Connect to Continue</h1>
          <p className="text-gray-500 font-jakarta text-[15px] mb-10 max-w-xs mx-auto leading-relaxed">
            Your identity lives onchain. Simple, secure, and permanent.
          </p>

          <div className="flex flex-col gap-3 w-full relative z-10">
            <WalletButton name="Sui Wallet" onClick={handleConnect} loading={connecting} delay={0.1} />
            <WalletButton name="Suiet" onClick={handleConnect} loading={connecting} delay={0.2} />
            <WalletButton name="Ethos Wallet" onClick={handleConnect} loading={connecting} delay={0.3} />
          </div>

          <div className="my-10 flex items-center gap-4 w-full opacity-30">
            <div className="h-[1px] flex-1 bg-black/20"></div>
            <span className="text-black font-jakarta text-[12px] font-bold">OR</span>
            <div className="h-[1px] flex-1 bg-black/20"></div>
          </div>

          <button 
            onClick={() => router.push('/onboarding')}
            className="text-[#4a2e8c] hover:text-black font-jakarta text-[14px] transition-all font-bold hover:tracking-wide"
          >
            Continue as Guest (View Only)
          </button>
        </GlassCard>
      </div>

      {/* Footer-like Branding */}
      <div className="absolute bottom-10 left-10 text-gray-400 font-jakarta text-[11px] font-bold tracking-widest uppercase">
        Built on Walrus Protocol
      </div>
    </div>
  );
}

function WalletButton({ name, onClick, loading, delay }: { name: string, onClick: () => void, loading: boolean, delay: number }) {
  return (
    <motion.button 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      disabled={loading}
      className="bg-white/60 backdrop-blur-md border border-white hover:border-[#cdb4ff] hover:bg-white p-4.5 flex items-center gap-4 w-full group transition-all rounded-[20px] shadow-sm hover:shadow-md"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-[#cdb4ff]/10 rounded-xl text-[#4a2e8c] group-hover:scale-110 transition-transform">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <span className="flex-1 text-left font-outfit font-bold text-gray-800 text-[16px]">{name}</span>
      {loading ? (
        <div className="w-5 h-5 border-2 border-[#4a2e8c] border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg className="opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all text-[#4a2e8c]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      )}
    </motion.button>
  );
}
