"use client";

import React from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter, useParams } from 'next/navigation';

export default function ResponseDetailPage() {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      {/* Left Nav (Shared with Dashboard) */}
      <aside className="w-[260px] glass-card !bg-white/2 !rounded-none border-y-0 border-l-0 p-6 flex flex-col">
        <div className="mb-12 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#00E5CC]">
            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-white font-syne font-bold text-sm tracking-tight">Walrus Sessions</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<OverviewIcon />} label="Overview" onClick={() => router.push('/dashboard')} />
          <NavItem icon={<FormsIcon />} label="My Forms" />
          <NavItem icon={<InboxIcon />} label="Responses" active />
          <NavItem icon={<ChartIcon />} label="Analytics" />
          <NavItem icon={<SettingsIcon />} label="Settings" onClick={() => router.push('/settings')} />
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 glass-card !bg-white/5 !rounded-none border-x-0 border-t-0 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#7A8CAB] hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="font-mono text-xs text-[#7A8CAB]">
              Dashboard / Bug Report / <span className="text-white">Response #{params.id}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
            
            {/* Left Column: Response Content */}
            <div className="space-y-8">
              <DetailCard label="Bug Title" value="App crashes when uploading large video files on Android 14" />
              <DetailCard label="Steps to Reproduce" value="1. Open the form on a Samsung S23\n2. Select a video file over 500MB\n3. Click the submit button\n4. The application freezes for 10 seconds and then force closes with error 0x82." />
              <DetailCard label="Severity" value="5 Stars" isRating />
              <DetailCard label="Screenshot" isImage />
              <DetailCard label="Reproduction Link" value="https://walrus-testnet.io/tx/0x123..." isLink />
            </div>

            {/* Right Column: Metadata & Notes */}
            <div className="space-y-6">
              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Metadata</h4>
                <div className="space-y-4">
                  <MetaItem label="Timestamp" value="May 06, 2026 13:45 UTC" />
                  <MetaItem label="Walrus Blob ID" value="0x7a2b9c3d4e5f6g7h..." isCopyable />
                  <MetaItem label="Respondent" value="0x1234...abcd" isCopyable />
                </div>
                <button className="w-full mt-6 py-2 border border-white/10 rounded-lg text-white font-mono text-xs hover:bg-white/5 transition-all">
                  View on Explorer
                </button>
              </GlassCard>

              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Status & Priority</h4>
                <div className="space-y-4">
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white outline-none focus:border-[#00E5CC]/30">
                    <option>New</option>
                    <option>In Review</option>
                    <option>Actioned</option>
                    <option>Archived</option>
                  </select>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-mono text-[#7A8CAB]">Priority</span>
                    <div className="flex gap-1 text-[#00E5CC]">
                      {[...Array(5)].map((_, i) => <span key={i} className="cursor-pointer">★</span>)}
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Internal Notes</h4>
                <textarea 
                  placeholder="Add a private note..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-white outline-none focus:border-[#00E5CC]/30 resize-none mb-2"
                />
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#00E5CC]/60">Saved ✓</span>
                </div>
              </GlassCard>

              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 !py-3 !text-xs !border-white/5">← Prev</Button>
                <Button variant="ghost" className="flex-1 !py-3 !text-xs !border-white/5">Next →</Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${
        active ? 'bg-[#00E5CC]/5 text-white' : 'text-[#7A8CAB] hover:text-white hover:bg-white/[0.02]'
      }`}
    >
      {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-[#00E5CC] rounded-full"></div>}
      <div className={`${active ? 'text-[#00E5CC]' : 'group-hover:text-white'} transition-colors`}>
        {icon}
      </div>
      <span className="font-mono text-sm font-medium">{label}</span>
    </button>
  );
}

function DetailCard({ label, value, isRating, isImage, isLink }: { label: string, value?: string, isRating?: boolean, isImage?: boolean, isLink?: boolean }) {
  return (
    <GlassCard className="!p-8">
      <label className="text-[10px] font-mono text-[#00E5CC] uppercase tracking-[0.2em] font-bold mb-4 block">{label}</label>
      {isImage ? (
        <div className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#7A8CAB] group cursor-pointer overflow-hidden">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </div>
      ) : isRating ? (
        <div className="flex gap-2 text-[#00E5CC] text-2xl">
          {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
        </div>
      ) : isLink ? (
        <a href={value} className="text-white hover:text-[#00E5CC] font-mono text-sm underline flex items-center gap-2">
          {value}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      ) : (
        <p className="text-lg text-white font-mono leading-relaxed whitespace-pre-wrap">{value}</p>
      )}
    </GlassCard>
  );
}

function MetaItem({ label, value, isCopyable }: { label: string, value: string, isCopyable?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <div className="text-[10px] font-mono text-[#7A8CAB] uppercase">{label}</div>
      <div className="text-right">
        <div className="text-[11px] text-white font-mono">{value}</div>
        {isCopyable && (
          <button className="text-[9px] text-[#00E5CC] hover:underline">Copy</button>
        )}
      </div>
    </div>
  );
}

// Icons
const OverviewIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>;
const FormsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
const InboxIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/><path d="M4 13h4.1a2 2 0 011.8 1.1L12 17l2.1-2.9a2 2 0 011.8-1.1H20"/></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18 17v-4M13 17v-7M8 17v-4"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
