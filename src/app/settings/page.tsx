"use client";

import React, { useState, useRef } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import AppBackground from '@/components/AppBackground';
import Navbar from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Icons ──────────────────────────────────────────────────────────────────

const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const TeamIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const DatabaseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;


const TABS = [
  { id: 'Profile', icon: <ProfileIcon /> },
  { id: 'Team', icon: <TeamIcon /> },
  { id: 'Encryption (Seal)', icon: <LockIcon /> },
  { id: 'AI Settings', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2zM7 12h.01M11 12h.01M15 12h.01"/></svg> },
  { id: 'Notifications', icon: <BellIcon /> },
  { id: 'Export & Data', icon: <DatabaseIcon /> },
  { id: 'Danger Zone', icon: <TrashIcon /> }
];

const SEAL_WALLETS_KEY = 'walrusform_seal_wallets';
const TEAM_KEY = 'walrusform_team';
const NOTIFICATIONS_KEY = 'walrusform_notifications';

function getSealWallets(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SEAL_WALLETS_KEY) ?? '[]'); } catch { return []; }
}
function saveSealWallets(ws: string[]) {
  localStorage.setItem(SEAL_WALLETS_KEY, JSON.stringify(ws));
}
function getTeamMembers(): { address: string; role: string }[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) ?? '[]'); } catch { return []; }
}
function saveTeamMembers(members: { address: string; role: string }[]) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(members));
}
function getNotifications(): { submissions: boolean; digest: boolean; system: boolean } {
  if (typeof window === 'undefined') return { submissions: true, digest: false, system: true };
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? '{"submissions":true,"digest":false,"system":true}');
  } catch {
    return { submissions: true, digest: false, system: true };
  }
}
function saveNotifications(prefs: { submissions: boolean; digest: boolean; system: boolean }) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs));
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const router = useRouter();
  const account = useCurrentAccount();
  const importRef = useRef<HTMLInputElement>(null);

  // Seal policy state
  const [sealWallets, setSealWallets] = useState<string[]>(() => getSealWallets());
  const [newWallet, setNewWallet] = useState('');
  const [sealSaved, setSealSaved] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<{ address: string; role: string }[]>(() => getTeamMembers());
  const [newTeamAddress, setNewTeamAddress] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [openRouterKey, setOpenRouterKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('worm_openrouter_key') ?? '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'deepseek/deepseek-v4-flash:free';
    return localStorage.getItem('worm_default_model') ?? 'deepseek/deepseek-v4-flash:free';
  });

  const addSealWallet = () => {
    const w = newWallet.trim();
    if (!w || sealWallets.includes(w)) return;
    const updated = [...sealWallets, w];
    setSealWallets(updated);
    saveSealWallets(updated);
    setNewWallet('');
    setSealSaved(true);
    setTimeout(() => setSealSaved(false), 2000);
  };

  const removeSealWallet = (w: string) => {
    const updated = sealWallets.filter((x) => x !== w);
    setSealWallets(updated);
    saveSealWallets(updated);
  };

  const addTeamMember = () => {
    const a = newTeamAddress.trim();
    if (!a) return;
    const updated = [...teamMembers, { address: a, role: 'viewer' }];
    setTeamMembers(updated);
    saveTeamMembers(updated);
    setNewTeamAddress('');
  };

  const removeTeamMember = (a: string) => {
    const updated = teamMembers.filter((m) => m.address !== a);
    setTeamMembers(updated);
    saveTeamMembers(updated);
  };

  const handleClearAll = () => {
    if (!confirm('This will clear ALL local form and response data. Walrus blobs are permanent and unaffected. Continue?')) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('walrusform_'))
      .forEach((k) => localStorage.removeItem(k));
    router.push('/');
  };

  const toggleNotification = (key: 'submissions' | 'digest' | 'system') => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleExportData = () => {
    const data: Record<string, string> = {};
    Object.keys(localStorage)
      .filter((k) => k.startsWith('walrusform_'))
      .forEach((k) => {
        const value = localStorage.getItem(k);
        if (value !== null) data[k] = value;
      });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walrusform_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDataMessage('Exported local data.');
    setTimeout(() => setDataMessage(null), 2000);
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, string>;
      Object.entries(parsed).forEach(([key, value]) => {
        if (key.startsWith('walrusform_')) localStorage.setItem(key, value);
      });
      setSealWallets(getSealWallets());
      setTeamMembers(getTeamMembers());
      setNotifications(getNotifications());
      setDataMessage('Imported local data.');
    } catch (e: unknown) {
      setDataMessage(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setTimeout(() => setDataMessage(null), 2500);
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
      <AppBackground />
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-8 pt-44 pb-20 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="text-6xl font-syne font-extrabold text-black mb-4 tracking-tight">Settings</h1>
            <p className="text-gray-500 font-jakarta font-bold text-sm uppercase tracking-widest">Configure your decentralized experience</p>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Tab Navigation */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <GlassCard className="!p-4 !rounded-[32px] !bg-white/60">
              <nav className="flex flex-col gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-jakarta font-bold text-sm transition-all relative group ${
                      activeTab === tab.id 
                        ? 'bg-[#4a2e8c] text-white shadow-lg' 
                        : 'text-gray-500 hover:bg-white hover:text-black shadow-sm hover:shadow-md'
                    }`}
                  >
                    <span className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-[#4a2e8c]'} transition-colors`}>
                      {tab.icon}
                    </span>
                    {tab.id}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </button>
                ))}
              </nav>
            </GlassCard>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'Profile' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="flex items-center gap-8 mb-12">
                      <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-[#cdb4ff] to-[#4a2e8c] flex items-center justify-center text-white text-3xl font-syne font-bold shadow-2xl">
                        {account ? account.address.slice(2, 4).toUpperCase() : 'WF'}
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-3xl font-syne font-extrabold text-black">Account Profile</h2>
                        <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest">Manage your connected wallet</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Wallet Address</label>
                          <div className="p-5 rounded-2xl bg-gray-50/50 border border-black/5 font-mono text-sm text-gray-600 break-all">
                            {account?.address ?? 'Not connected'}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Current Network</label>
                          <div className="p-5 rounded-2xl bg-gray-50/50 border border-black/5 font-jakarta font-bold text-sm text-black flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Sui Testnet
                          </div>
                        </div>
                      </div>

                      {!account && (
                        <div className="pt-6">
                          <ConnectButton className="!rounded-full !bg-[#4a2e8c] !px-10 !py-4" />
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {activeTab === 'Encryption (Seal)' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-syne font-extrabold text-black">Seal Encryption</h2>
                        <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest">End-to-end privacy policy</p>
                      </div>
                      <Badge color={sealWallets.length > 0 ? 'green' : 'gray'}>
                        {sealWallets.length > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500 font-jakarta font-medium leading-relaxed mb-10 max-w-2xl">
                      Seal encryption ensures your form responses are only accessible to approved members. 
                      Add wallet addresses below to grant them future decryption rights.
                    </p>

                    <div className="space-y-6">
                      <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Approved Wallets ({sealWallets.length})</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {sealWallets.map((w) => (
                          <div key={w} className="flex items-center justify-between p-4 bg-white border border-black/5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <span className="font-mono text-xs text-gray-600">{w.slice(0, 12)}…{w.slice(-8)}</span>
                            <button onClick={() => removeSealWallet(w)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">×</button>
                          </div>
                        ))}
                        {sealWallets.length === 0 && (
                          <div className="md:col-span-2 p-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center">
                            <p className="text-xs font-jakarta font-bold text-gray-400">No wallets added to policy yet</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 p-2 bg-white rounded-[28px] border border-black/5 shadow-inner">
                        <input
                          placeholder="Enter wallet address (0x...)"
                          value={newWallet}
                          onChange={(e) => setNewWallet(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSealWallet()}
                          className="flex-1 bg-transparent border-none outline-none px-6 font-mono text-sm text-black placeholder:text-gray-300"
                        />
                        <Button className="!rounded-full !px-8 !py-3" onClick={addSealWallet}>Add</Button>
                      </div>
                      {sealSaved && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-jakarta font-bold text-green-500 mt-2 px-6">Policy updated successfully ✓</motion.p>}
                    </div>
                  </GlassCard>
                )}
                {activeTab === 'AI Settings' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-syne font-extrabold text-black">AI Intelligence</h2>
                        <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest">OpenRouter API Configuration</p>
                      </div>
                      <Badge color={openRouterKey ? 'green' : 'gray'}>
                        {openRouterKey ? 'Configured' : 'Missing Key'}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500 font-jakarta font-medium leading-relaxed mb-10 max-w-2xl">
                      Worm uses OpenRouter to provide AI-powered insights on decentralized feedback. 
                      Your API key is stored strictly in your browser's local storage and is never sent to our servers.
                    </p>

                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">OpenRouter API Key</label>
                        <div className="flex gap-4 p-2 bg-white rounded-[28px] border border-black/5 shadow-inner">
                          <input
                            type={showApiKey ? "text" : "password"}
                            placeholder="sk-or-v1-..."
                            value={openRouterKey}
                            onChange={(e) => {
                              setOpenRouterKey(e.target.value);
                              localStorage.setItem('worm_openrouter_key', e.target.value);
                            }}
                            className="flex-1 bg-transparent border-none outline-none px-6 font-mono text-sm text-black placeholder:text-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="px-3 text-gray-400 hover:text-[#4a2e8c] transition-colors font-jakarta font-bold text-xs uppercase"
                          >
                            {showApiKey ? 'Hide' : 'Show'}
                          </button>
                          <Button 
                            className="!rounded-full !px-8 !py-3" 
                            onClick={() => {
                              localStorage.setItem('worm_openrouter_key', openRouterKey);
                              alert('API Key saved to local storage.');
                            }}
                          >
                            Save
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-jakarta mt-2 ml-1">
                          Get a key from <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-[#4a2e8c] underline">openrouter.ai</a>.
                        </p>
                      </div>

                      <div className="mt-6">
                        <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">Default Model ID</label>
                        <div className="flex gap-4 p-2 bg-white rounded-[28px] border border-black/5 shadow-inner">
                          <input
                            type="text"
                            placeholder="deepseek/deepseek-v4-flash:free"
                            value={selectedModel}
                            onChange={(e) => {
                              setSelectedModel(e.target.value);
                              localStorage.setItem('worm_default_model', e.target.value);
                            }}
                            className="flex-1 bg-transparent border-none outline-none px-6 font-mono text-sm text-black placeholder:text-gray-300"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-jakarta mt-2 ml-1">
                          The model used for AI Insights. E.g., `deepseek/deepseek-v4-flash:free`, `google/gemma-4-31b-it:free`.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {activeTab === 'Team' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="mb-10">
                      <h2 className="text-3xl font-syne font-extrabold text-black">Team Management</h2>
                      <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest mt-1">Collaborate on your sessions</p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-3 mb-8">
                        {teamMembers.map((m) => (
                          <div key={m.address} className="flex items-center justify-between p-5 bg-white border border-black/5 rounded-[24px] shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#4a2e8c]/5 flex items-center justify-center text-[#4a2e8c]">
                                <TeamIcon />
                              </div>
                              <span className="font-mono text-sm text-gray-700">{m.address.slice(0, 18)}…</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge color="blue">{m.role}</Badge>
                              <button onClick={() => removeTeamMember(m.address)} className="text-gray-400 hover:text-red-500 transition-colors px-2 text-xl">×</button>
                            </div>
                          </div>
                        ))}
                        {teamMembers.length === 0 && (
                          <div className="p-12 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center">
                            <p className="text-sm font-jakarta font-bold text-gray-400">Your team is currently empty</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 p-2 bg-white rounded-[28px] border border-black/5 shadow-inner">
                        <input
                          placeholder="Invite by wallet address..."
                          value={newTeamAddress}
                          onChange={(e) => setNewTeamAddress(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                          className="flex-1 bg-transparent border-none outline-none px-6 font-mono text-sm text-black placeholder:text-gray-300"
                        />
                        <Button className="!rounded-full !px-8 !py-3" onClick={addTeamMember}>Invite</Button>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {activeTab === 'Danger Zone' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-[#ff4d6a]/20 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-[#ff4d6a]">
                      <TrashIcon />
                    </div>
                    <div className="mb-10">
                      <h2 className="text-3xl font-syne font-extrabold text-[#ff4d6a]">Danger Zone</h2>
                      <p className="text-[#ff4d6a]/40 font-jakarta font-bold text-xs uppercase tracking-widest mt-1">Irreversible actions</p>
                    </div>

                    <div className="p-8 bg-red-50/50 rounded-[32px] border border-red-100 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                      <div>
                        <h4 className="font-syne font-bold text-lg text-black mb-2">Clear Local Registry</h4>
                        <p className="text-sm text-gray-500 font-jakarta font-medium max-w-md">
                          This will clear all local indexing data for your forms and responses. 
                          Walrus blobs are permanent and will not be deleted, but they will vanish from your local dashboard.
                        </p>
                      </div>
                      <Button variant="danger" className="!rounded-full !px-12 !py-4 shadow-lg shadow-red-500/20" onClick={handleClearAll}>
                        Clear Data
                      </Button>
                    </div>
                  </GlassCard>
                )}

                {activeTab === 'Notifications' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="mb-10">
                      <h2 className="text-3xl font-syne font-extrabold text-black">Notifications</h2>
                      <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest mt-1">Control delivery preferences</p>
                    </div>

                    <div className="space-y-6">
                      {[
                        { key: 'submissions', title: 'Submission Alerts', desc: 'Notify on new Walrus responses.' },
                        { key: 'digest', title: 'Weekly Digest', desc: 'Summary of form activity.' },
                        { key: 'system', title: 'System Updates', desc: 'Protocol and client updates.' },
                      ].map((row) => (
                        <div key={row.key} className="p-6 rounded-[28px] bg-gray-50/50 border border-black/5 flex items-center justify-between">
                          <div>
                            <div className="font-jakarta font-bold text-sm text-black">{row.title}</div>
                            <div className="text-[11px] text-gray-400 font-jakarta font-bold uppercase tracking-widest mt-1">{row.desc}</div>
                          </div>
                          <button
                            onClick={() => toggleNotification(row.key as 'submissions' | 'digest' | 'system')}
                            className={`w-14 h-7 rounded-full p-1 transition-all duration-500 ${notifications[row.key as 'submissions' | 'digest' | 'system'] ? 'bg-[#4a2e8c]' : 'bg-gray-200 shadow-inner'}`}
                          >
                            <motion.div
                              animate={{ x: notifications[row.key as 'submissions' | 'digest' | 'system'] ? 28 : 0 }}
                              className="w-5 h-5 rounded-full bg-white shadow-xl"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {activeTab === 'Export & Data' && (
                  <GlassCard className="!p-10 !rounded-[40px] !bg-white/90 border-white shadow-xl">
                    <div className="mb-10">
                      <h2 className="text-3xl font-syne font-extrabold text-black">Export & Data</h2>
                      <p className="text-gray-400 font-jakarta font-bold text-xs uppercase tracking-widest mt-1">Backup or restore local indexes</p>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-[28px] bg-gray-50/50 border border-black/5">
                        <div className="font-jakarta font-bold text-sm text-black mb-2">Export Local Data</div>
                        <p className="text-[11px] text-gray-400 font-jakarta font-bold uppercase tracking-widest mb-4">Includes form registry, submissions, notes</p>
                        <Button className="!rounded-full !px-8 !py-3" onClick={handleExportData}>Download JSON</Button>
                      </div>

                      <div className="p-6 rounded-[28px] bg-gray-50/50 border border-black/5">
                        <div className="font-jakarta font-bold text-sm text-black mb-2">Import Backup</div>
                        <p className="text-[11px] text-gray-400 font-jakarta font-bold uppercase tracking-widest mb-4">Restores local registry and metadata</p>
                        <input
                          ref={importRef}
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImportData(file);
                          }}
                        />
                        <Button
                          variant="ghost"
                          className="!rounded-full !px-8 !py-3"
                          onClick={() => importRef.current?.click()}
                        >
                          Upload JSON
                        </Button>
                      </div>

                      {dataMessage && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-jakarta font-bold text-green-500 px-2">
                          {dataMessage}
                        </motion.p>
                      )}
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

