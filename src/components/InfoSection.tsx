import React from 'react';
import Link from 'next/link';

const InfoSection = () => {
  return (
    <section className="bg-[#050505] text-white pt-32 pb-32 relative -mt-10 rounded-t-[3rem] z-30">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#1a1a1a] to-transparent rounded-t-[3rem] pointer-events-none"></div>
      
      <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10 space-y-32">
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg font-syne font-extrabold">
            Custom Forms Onchain
          </h2>
          <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex flex-col items-start max-w-xl font-jakarta">
            <p>
              Build forms for bug reports, surveys, or feedback with rich text, dropdowns, star ratings, and file uploads. All submissions are stored securely on Walrus. Private data is end-to-end encrypted using Seal cryptography, avoiding the tradeoffs that come with centralized cloud providers.
            </p>
            <Link 
              href="/docs/custom-forms" 
              className="mt-6 text-white hover:text-white/70 transition-colors text-sm font-bold flex items-center gap-1 group"
            >
              Learn More 
              <svg className="transform group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg font-syne font-extrabold">
            Admin Dashboard &amp; Security
          </h2>
          <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex flex-col items-start max-w-xl font-jakarta">
            <p>
              Private dashboard to review submissions, add internal notes, filter responses, and export insights. Securely collect structured feedback directly from your community without compromising privacy. Walrus Form unlocks features you couldn&apos;t easily build before: programmable storage and enforceable access controls that protect sensitive data.
            </p>
            <Link 
              href="/docs/security" 
              className="mt-6 text-white hover:text-white/70 transition-colors text-sm font-bold flex items-center gap-1 group"
            >
              Learn More 
              <svg className="transform group-hover:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default InfoSection;
