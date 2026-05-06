import React from 'react';

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 px-8 py-6 flex justify-between items-center z-50 text-black w-full max-w-[1600px] mx-auto">
      <div className="font-extrabold text-[28px] tracking-tight flex items-center">
        walrus
      </div>
      
      <div className="hidden md:flex gap-10 text-[15px] font-medium">
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
          Discover 
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
          Build
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity">
          Ecosystem
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </div>
      </div>

      <button className="rounded-full border border-black/20 px-5 py-2.5 text-[15px] font-medium flex items-center gap-2 hover:bg-black/5 transition-colors">
        Read the docs 
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </nav>
  );
};

export default Navbar;
