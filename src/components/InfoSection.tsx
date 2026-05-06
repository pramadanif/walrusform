import React from 'react';

const InfoSection = () => {
  return (
    <section className="bg-[#050505] text-white pt-32 pb-32 relative -mt-10 rounded-t-[3rem] z-30">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#1a1a1a] to-transparent rounded-t-[3rem] pointer-events-none"></div>
      
      <div className="max-w-[1400px] w-full mx-auto px-8 relative z-10 space-y-32">
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg">
            Custom Forms Onchain
          </h2>
          <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex items-center max-w-xl">
            Build forms for bug reports, surveys, or feedback with rich text, dropdowns, star ratings, and file uploads. All submissions are stored securely on Walrus. Private data is end-to-end encrypted using Seal cryptography, avoiding the tradeoffs that come with centralized cloud providers.
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-32">
          <h2 className="text-[2.5rem] md:text-[3rem] font-medium leading-[1.1] tracking-[-0.03em] max-w-lg">
            Admin Dashboard &amp; Security
          </h2>
          <div className="text-[17px] leading-[1.6] text-[#a0a0a0] font-medium flex items-center max-w-xl">
            Private dashboard to review submissions, add internal notes, filter responses, and export insights. Securely collect structured feedback directly from your community without compromising privacy. Walrus Form unlocks features you couldn&apos;t easily build before: programmable storage and enforceable access controls that protect sensitive data.
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default InfoSection;
