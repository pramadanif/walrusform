"use client";

import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { label: 'Discover', href: '/templates' },
    { label: 'Build', href: '/builder' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[1200px] z-[100]"
    >
      <div className="glass-card !py-4 !px-8 !rounded-full flex justify-between items-center shadow-2xl border-white/40 bg-white/70 backdrop-blur-xl">
        <div 
          className="font-syne font-extrabold text-[24px] tracking-tight flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <div className="relative w-10 h-10 group-hover:scale-110 transition-transform">
            <Image 
              src="/wormlogo.png" 
              alt="worm logo" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="hidden sm:block">worm</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-[14px] font-jakarta font-bold">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href}
              className={`relative py-1 group transition-colors ${pathname === link.href ? 'text-black' : 'text-black/50 hover:text-black'}`}
            >
              {link.label}
              <motion.div 
                className={`absolute bottom-0 left-0 h-[2px] bg-[#4a2e8c] rounded-full`}
                initial={false}
                animate={{ width: pathname === link.href ? '100%' : '0%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ConnectButton 
              className="!rounded-full !bg-black !text-white !font-outfit !font-bold !text-[13px] !px-6 !py-2.5 hover:!bg-black/80 transition-all !border-none !shadow-lg"
            />
          </div>
          <button 
            onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-white/50 border border-black/5 flex items-center justify-center hover:bg-white transition-colors group"
          >
            <svg className="text-black/60 group-hover:text-black transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

