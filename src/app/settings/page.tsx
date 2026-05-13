"use client";

import React, { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

const TABS = ['Profile', 'Team', 'Encryption (Seal)', 'Notifications', 'Export & Data', 'Danger Zone'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      {/* Left Nav */}
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
          <NavItem icon={<InboxIcon />} label="Responses" />
          <NavItem icon={<ChartIcon />} label="Analytics" />
          <NavItem icon={<SettingsIcon />} label="Settings" active />
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 glass-card !bg-white/5 !rounded-none border-x-0 border-t-0 px-8 flex items-center z-10">
          <h1 className="text-2xl font-syne font-bold">Settings</h1>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Inner Tab Nav */}
          <aside className="w-[240px] p-8 space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg font-mono text-xs transition-all ${
                  activeTab === tab ? 'bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/20' : 'text-[#7A8CAB] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-2xl space-y-12">
              
              {activeTab === 'Profile' && (
                <section className="space-y-6">
                  <GlassCard className="!p-8">
                    <h3 className="text-lg font-syne font-bold mb-8">Profile Details</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00E5CC] to-[#0090FF] flex items-center justify-center text-[#050810] text-2xl font-bold">MB</div>
                        <button className="text-[#00E5CC] font-mono text-xs hover:underline">Change Avatar</button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-[#7A8CAB] uppercase">Display Name</label>
                        <input defaultValue="Muhammad Bagus" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-sm text-white outline-none focus:border-[#00E5CC]/30" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-[#7A8CAB] uppercase">Wallet Address</label>
                        <input readOnly value="0x72a...92f1" className="w-full bg-white/2 border border-white/5 rounded-xl px-4 py-2 font-mono text-sm text-[#7A8CAB] outline-none" />
                      </div>
                    </div>
                  </GlassCard>
                  <Button variant="danger" className="!px-6 !py-2 !text-xs">Disconnect Wallet</Button>
                </section>
              )}

              {activeTab === 'Encryption (Seal)' && (
                <section className="space-y-6">
                  <GlassCard className="!p-8">
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="text-lg font-syne font-bold">Active Policy</h3>
                      <StatusBadge status="Actioned" />
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-white/2 border border-white/5 rounded-xl font-mono text-[10px] text-[#7A8CAB] break-all">
                        Policy ID: 0x92b8c2d1e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-mono text-[#7A8CAB] uppercase">Approved Wallets</label>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-[#00E5CC]/10 border border-[#00E5CC]/20 rounded-full font-mono text-[10px] text-[#00E5CC] flex items-center gap-2">
                            0x72a...92f1 <button className="hover:text-white">×</button>
                          </span>
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] text-[#7A8CAB] flex items-center gap-2">
                            0x123...abcd <button className="hover:text-white">×</button>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Add wallet address..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs text-white outline-none focus:border-[#00E5CC]/30" />
                        <Button className="!px-4 !py-2 !text-xs">Add +</Button>
                      </div>
                    </div>
                  </GlassCard>
                  <div className="p-6 bg-[#7B61FF]/5 border border-[#7B61FF]/20 rounded-2xl flex gap-4">
                    <div className="text-[#7B61FF]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                    <p className="text-[11px] text-[#7A8CAB] font-mono leading-relaxed">Seal encryption ensures your form responses are only accessible to approved team members. Data is encrypted before storage.</p>
                  </div>
                </section>
              )}

              {activeTab === 'Danger Zone' && (
                <section className="space-y-6">
                  <div className="glass-card !bg-[#FF4D6A]/5 border-[#FF4D6A]/20 p-8 space-y-6">
                    <h3 className="text-lg font-syne font-bold text-[#FF4D6A]">Danger Zone</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-syne font-bold text-sm">Delete All Responses</div>
                          <div className="text-xs text-[#7A8CAB] font-mono">This action cannot be undone.</div>
                        </div>
                        <Button variant="danger" className="!py-2 !text-xs">Delete</Button>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-[#FF4D6A]/10">
                        <div>
                          <div className="font-syne font-bold text-sm">Delete This Form</div>
                          <div className="text-xs text-[#7A8CAB] font-mono">Remove this form and all associated metadata.</div>
                        </div>
                        <Button variant="danger" className="!py-2 !text-xs">Delete Form</Button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="px-2 py-0.5 bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/20 rounded-full font-mono text-[9px] uppercase tracking-wider">
      {status}
    </span>
  );
}

// Icons
const OverviewIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>;
const FormsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
const InboxIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/><path d="M4 13h4.1a2 2 0 011.8 1.1L12 17l2.1-2.9a2 2 0 011.8-1.1H20"/></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18 17v-4M13 17v-7M8 17v-4"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
