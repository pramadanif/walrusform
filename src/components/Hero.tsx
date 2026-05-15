"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from './ui';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const router = useRouter();

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

  const headingWords = "Worm".split(" ");

  return (
    <main className="relative min-h-[100vh] w-full flex flex-col items-center justify-center pt-24 overflow-hidden">
      {/* Liquid Background Gradient Shapes */}
      <div className="absolute inset-0 w-full h-full z-0 bg-white overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] bg-[#dcfce7] rounded-full blur-[100px] opacity-50 animate-pulse"></div>
        <div className="absolute top-[10%] right-[-10%] w-[55%] h-[65%] bg-[#e0f2fe] rounded-full blur-[110px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[60%] bg-[#fae8ff] rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute top-[30%] left-[25%] w-[40%] h-[50%] bg-[#f5f3ff] rounded-full blur-[110px] opacity-60"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[45%] h-[55%] bg-[#ecfeff] rounded-full blur-[100px] opacity-60"></div>
      </div>

      {/* Hero Image Container */}
      <div className="absolute inset-0 w-full h-full z-10 flex justify-center items-end overflow-hidden pointer-events-none">
        <div 
          className="relative w-full h-[85%] max-w-[1600px] mx-auto pointer-events-auto group/hero-img"
        >
          <motion.div 
            className="w-full h-full relative translate-y-[20%] group-hover/hero-img:translate-y-[8%] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ 
              transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px) translateY(var(--tw-translate-y))`,
            }}
          >
            <Image 
              src="/hero.png" 
              alt="Hero Background" 
              fill
              className="object-contain object-bottom opacity-100 scale-105"
              priority
            />
          </motion.div>
        </div>
      </div>
      
      {/* Content */}
      <motion.div 
        className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto -mt-32"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#cdb4ff] text-[#4a2e8c] text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-8 shadow-sm"
        >
          Walrus Sessions Hackathon
        </motion.div>
        
        <h1 className="text-[4.5rem] md:text-[8.5rem] leading-[0.9] font-syne font-extrabold tracking-[-0.05em] mb-8 text-black max-w-5xl mx-auto flex flex-wrap justify-center gap-x-6">
          {headingWords.map((word, i) => (
            <motion.span 
              key={i} 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[20px] md:text-[24px] text-black/60 font-jakarta font-medium tracking-tight max-w-[850px] leading-relaxed mb-12"
        >
          A fully decentralized, Network-native feedback and form platform built on the Walrus Protocol. Securely collect structured feedback directly from your community.
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4"
        >
          <Button 
            onClick={() => router.push('/builder')}
            className="!px-12 !py-6 !text-[20px] shadow-2xl"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          >
            Create Session
          </Button>
          <Button 
            variant="ghost"
            onClick={() => router.push('/templates')}
            className="!px-8 !py-6 !text-[20px] border-black/10"
          >
            Templates
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] font-jakarta font-bold text-black/30 uppercase tracking-[0.2em]">Scroll to explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-black/20 to-transparent" />
      </motion.div>

      <div className="absolute bottom-8 right-8 z-20">
        <button className="glass-card !bg-white/50 !px-4 !py-2 !rounded-full text-sm font-jakarta font-bold flex items-center gap-2 shadow-sm hover:bg-white transition-colors border-white/40">
          English 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </main>
  );
};

export default Hero;

