import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-24 pb-0 relative overflow-hidden flex flex-col min-h-screen group/footer">
      <div className="max-w-[1400px] w-full mx-auto px-8 grid grid-cols-1 md:grid-cols-5 gap-8 mb-20 z-10">
        {/* Col 1 */}
        <div className="flex flex-col gap-4">
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">About</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">WAL Token</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Use WAL</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Blog 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
        </div>
        
        {/* Col 2 */}
        <div className="flex flex-col gap-4">
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Read the Docs 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Ecosystem</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Grants & RFPs</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Cost Calculator 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            GitHub 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
        </div>

        {/* Col 3 */}
        <div className="flex flex-col gap-4">
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">AI</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Data Markets</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">DeFi</a>
        </div>

        {/* Col 4 */}
        <div className="flex flex-col gap-4">
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Events 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Media Kit 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Release Schedule</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors">Newsletter</a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Privacy 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Terms of Service 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Claim 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
          <a href="#" className="text-[15px] font-medium text-white hover:text-white/70 transition-colors flex items-center gap-1">
            Careers 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
        </div>

        {/* Col 5 */}
        <div className="flex flex-col items-end gap-6 ml-auto">
          <button className="rounded-full border border-white/20 px-5 py-2.5 text-[15px] font-medium flex items-center gap-2 hover:bg-white/10 transition-colors text-white">
            Read the docs 
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div className="flex gap-4 items-center mt-2">
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
            </a>
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="#" className="text-white hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          <div className="text-[12px] text-white/50 mt-auto pt-24 text-right">
            © 2024 Copyright Walrus Foundation. All rights reserved.
          </div>
        </div>
      </div>

      {/* Large bottom text and image container */}
      <div className="relative w-full flex-grow flex justify-center items-end mt-10">
        {/* Giant WALRUS text */}
        <div className="absolute inset-x-0 bottom-0 text-center select-none overflow-hidden flex justify-center leading-none pointer-events-none">
          <h1 className="text-[32vw] font-bold text-[#f4f4f4] tracking-[-0.04em] leading-[0.7] -mb-4">
            walrus
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
          <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
            English 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
