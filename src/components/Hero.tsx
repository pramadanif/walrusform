import React from 'react';
import Image from 'next/image';

const Hero = () => {
  return (
    <main className="relative min-h-[100vh] w-full flex flex-col items-center justify-center pt-24 overflow-hidden group/hero">
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
        <div className="relative w-full h-[75%] max-w-[1600px] mx-auto translate-y-[40%] group-hover/hero:translate-y-[15%] transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)">
          <Image 
            src="/alkimi-hero.avif" 
            alt="Hero Background" 
            fill
            className="object-contain object-bottom opacity-100"
            priority
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto -mt-32">
        <div className="bg-[#cdb4ff] text-[#4a2e8c] text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-md mb-8 shadow-sm">
          Case Study
        </div>
        
        <h1 className="text-[5.5rem] leading-[1] font-bold tracking-[-0.04em] mb-6 text-black max-w-4xl mx-auto blur-in">
          Walrus Form
        </h1>
        
        <p className="text-[22px] text-black/80 font-medium tracking-tight max-w-[800px] blur-in" style={{ animationDelay: '0.2s' }}>
          A fully decentralized, Network-native feedback and form platform built on the Walrus Protocol.
        </p>

        {/* Animated Button with circulating line */}
        <div className="mt-12 relative group inline-flex p-[3px] overflow-hidden rounded-full cursor-pointer shadow-[0_0_20px_rgba(57,59,178,0.2)] hover:shadow-[0_0_30px_rgba(57,59,178,0.4)] transition-shadow duration-300 blur-in" style={{ animationDelay: '0.4s' }}>
          <span className="absolute inset-[-1000%] animate-rotate-border bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <button className="relative bg-white/95 backdrop-blur-xl text-gray-900 px-10 py-4 rounded-full text-[19px] font-bold flex items-center gap-3 transition-all hover:bg-white w-full h-full">
            Create Form 
            <svg className="animate-bounce-x" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 z-20">
        <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
          English 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </main>
  );
};

export default Hero;
