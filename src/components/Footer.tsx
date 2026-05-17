import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 pb-0 relative overflow-hidden flex flex-col min-h-screen group/footer">
      <div className="max-w-[1400px] w-full mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-20 z-10">
        {/* Col 1: Brand */}
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-syne font-extrabold text-white">worm</h3>
          <p className="text-sm text-white/50 font-jakarta">Verifiable, immutable, and decentralized feedback infrastructure.</p>
        </div>
        
        {/* Col 2: Features */}
        <div className="flex flex-col gap-4 font-jakarta">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Features</div>
          <Link href="/docs/incentivized-forms" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Incentives</Link>
          <Link href="/docs/ai-insights" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">AI Analysis</Link>
          <Link href="/docs/seal-encryption" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Seal Security</Link>
        </div>

        {/* Col 3: Resources */}
        <div className="flex flex-col gap-4 font-jakarta">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Resources</div>
          <Link href="/docs/custom-forms" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Documentation</Link>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">GitHub</a>
        </div>

        {/* Col 4: Copyright & Socials */}
        <div className="flex flex-col items-end justify-between ml-auto">
          <div className="flex gap-4 items-center">
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          <div className="text-[12px] text-white/50 mt-auto font-jakarta">
            © 2026 worm. All rights reserved.
          </div>
        </div>
      </div>

      {/* Large bottom text and image container */}
      <div className="relative w-full flex-grow flex justify-center items-end mt-10">
        {/* Giant WORM text */}
        <div className="absolute inset-x-0 bottom-0 text-center select-none overflow-hidden flex justify-center leading-none pointer-events-none">
          <h1 className="text-[32vw] font-bold text-[#f4f4f4] tracking-[-0.04em] leading-[0.7] -mb-4">
            worm
          </h1>
        </div>
        
        {/* Walrus Character Image */}
        <div className="relative z-10 w-full max-w-[550px] aspect-square translate-y-[35%] group-hover/footer:translate-y-[5%] transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1)">
          <Image 
            src="/wal-footer.avif" 
            alt="Walrus footer character" 
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
        
        {/* English Button */}
        <div className="absolute bottom-8 right-8 z-20">
          <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors font-jakarta">
            English 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
