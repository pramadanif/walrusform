"use client";

import React, { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

const RESPONSES = [
  { id: '#1024', preview: 'App crashes when uploading large video files...', rating: 5, status: 'New', date: '2m ago' },
  { id: '#1023', preview: 'The UI feels a bit sluggish on mobile safari...', rating: 3, status: 'In Review', date: '45m ago' },
  { id: '#1022', preview: 'Feature request: Add support for multi-sig...', rating: 4, status: 'Actioned', date: '3h ago' },
  { id: '#1021', preview: 'Typo in the onboarding documentation section...', rating: 1, status: 'Archived', date: '1d ago' },
  { id: '#1020', preview: 'Walrus node sync issues on testnet dev-2...', rating: 5, status: 'New', date: '1d ago' },
];

export default function DashboardPage() {
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
      <AppBackground />
      <Navbar />
      
      {/* Decorative Proporsional Mascot (Peeking from right middle) */}
      <div className="fixed top-1/2 -right-16 w-64 h-64 opacity-20 pointer-events-none hover:-translate-x-12 transition-transform duration-1000 z-0">
        <Image src="/alkimi-hero.avif" alt="Mascot" fill className="object-contain" />
      </div>

      <main className="max-w-[1400px] mx-auto px-8 pt-32 pb-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-outfit font-bold text-black mb-3">Dashboard</h1>
            <p className="text-gray-500 font-jakarta font-bold text-sm">Managing your decentralized feedback sessions.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card !py-2 !px-4 !rounded-2xl border-black/5 flex items-center gap-3">
               <span className="text-[11px] font-jakarta font-bold text-gray-400">SESSION:</span>
               <select className="bg-transparent font-jakarta font-bold text-[13px] outline-none cursor-pointer">
                  <option>Bug Report #1</option>
                  <option>DAO Survey</option>
               </select>
            </div>
            <Button onClick={() => router.push('/builder')} className="shadow-2xl">New Form +</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Responses" value="1,024" delta="+12%" icon={<FormsIcon />} />
          <StatCard label="Success Rate" value="98.5%" delta="+2%" icon={<ChartIcon />} />
          <StatCard label="Avg Rating" value="4.8" icon={<OverviewIcon />} />
          <StatCard label="Walrus Blobs" value="42" icon={<InboxIcon />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main List */}
          <div className="lg:col-span-2">
            <GlassCard className="!p-0 overflow-hidden !bg-white/90 !rounded-[40px] border-white shadow-2xl">
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-xl font-outfit font-bold">Recent Submissions</h3>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </button>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.03] bg-black/[0.01]">
                    <th className="p-5 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-10">ID</th>
                    <th className="p-5 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Preview</th>
                    <th className="p-5 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</th>
                    <th className="p-5 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right pr-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.02]">
                  {RESPONSES.map((resp) => (
                    <tr 
                      key={resp.id}
                      onClick={() => setSelectedResponse(resp)}
                      className="hover:bg-[#cdb4ff]/5 cursor-pointer group transition-all"
                    >
                      <td className="p-5 pl-10 font-jakarta font-bold text-xs text-gray-400 group-hover:text-[#4a2e8c]">{resp.id}</td>
                      <td className="p-5 text-[13px] text-gray-800 font-medium max-w-xs truncate">{resp.preview}</td>
                      <td className="p-5">
                        <StatusBadge status={resp.status} />
                      </td>
                      <td className="p-5 text-right pr-10">
                        <button className="text-[#4a2e8c] font-outfit font-bold text-xs">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <GlassCard className="!p-8 !bg-[#4a2e8c] !text-white !rounded-[40px] relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-2xl font-outfit font-bold mb-4">Permanent Node</h3>
                <p className="text-white/70 font-jakarta text-[14px] leading-relaxed mb-8">Move your data to a dedicated Walrus Node for 100% uptime and faster blobs.</p>
                <Button variant="ghost" className="w-full !bg-white/10 !border-white/10 !text-white hover:!bg-white hover:!text-black font-bold">Configure Node</Button>
              </div>
              {/* Proporsional Mascot Peeking inside small card */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <Image src="/wal-footer.avif" alt="Mascot" fill className="object-contain" />
              </div>
            </GlassCard>

            <GlassCard className="!p-8 !bg-white/90 !rounded-[40px] border-white shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-outfit font-bold mb-6">Live Feed</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-2 h-10 bg-[#cdb4ff] rounded-full"></div>
                  <div>
                    <div className="font-jakarta font-bold text-[13px]">New submission #1024</div>
                    <div className="font-jakarta text-[11px] text-gray-400">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-2 h-10 bg-green-200 rounded-full"></div>
                  <div>
                    <div className="font-jakarta font-bold text-[13px]">Blob stored successfully</div>
                    <div className="font-jakarta text-[11px] text-gray-400">15 minutes ago</div>
                  </div>
                </div>
              </div>
              {/* Mascot Peeking from sidebar card bottom */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 opacity-10 group-hover:translate-y-[-10px] transition-transform duration-1000">
                <Image src="/alkimi-hero.avif" alt="Mascot" fill className="object-contain" />
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Slide-over Detail Panel */}
      <AnimatePresence>
        {selectedResponse && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedResponse(null)} className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[110]" />
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              className="fixed top-6 bottom-6 right-6 w-[480px] glass-card !bg-white !rounded-[48px] z-[120] p-12 flex flex-col shadow-2xl border-white"
            >
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="text-gray-400 font-outfit font-bold text-lg mb-1">{selectedResponse.id}</div>
                  <h3 className="text-3xl font-outfit font-bold">Response Detail</h3>
                </div>
                <button onClick={() => setSelectedResponse(null)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black transition-all border border-black/5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 custom-scrollbar pr-2">
                <DetailItem label="Submission Preview" value={selectedResponse.preview} />
                <DetailItem label="Protocol Status" value="Verifiable Onchain" />
                <div className="p-8 bg-gray-50 rounded-[32px] border border-black/5">
                   <label className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-4 block">Internal Note</label>
                   <textarea className="w-full bg-transparent border-none outline-none font-jakarta text-[13px] resize-none" rows={4} placeholder="Type a private note..." />
                </div>
              </div>

              <div className="pt-10 border-t border-black/5 flex gap-4 mt-auto">
                <Button variant="ghost" className="flex-1 !py-4 !border-black/5 font-bold">Archive</Button>
                <Button onClick={() => router.push(`/dashboard/response/${selectedResponse.id.replace('#', '')}`)} className="flex-2 !py-4 shadow-2xl">Full Analysis</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, delta, icon }: { label: string, value: string, delta?: string, icon: React.ReactNode }) {
  return (
    <GlassCard className="!p-8 relative overflow-hidden group !bg-white/95 !rounded-[40px] border-white shadow-lg hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4a2e8c]/5 flex items-center justify-center text-[#4a2e8c] group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        {delta && (
          <div className="bg-green-50 text-green-600 px-2 py-1 rounded-lg font-jakarta font-bold text-[10px] flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            {delta}
          </div>
        )}
      </div>
      <div>
        <div className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-outfit font-bold text-black">{value}</div>
      </div>
    </GlassCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-600 border-blue-100',
    'In Review': 'bg-purple-50 text-purple-600 border-purple-100',
    'Actioned': 'bg-green-50 text-green-600 border-green-100',
    'Archived': 'bg-gray-50 text-gray-500 border-gray-100',
  };
  return (
    <span className={`px-3 py-1 rounded-full border font-jakarta font-bold text-[9px] uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      <div className="text-[15px] text-gray-800 font-jakarta font-medium bg-gray-50 border border-black/[0.03] rounded-[24px] p-6 shadow-sm">
        {value}
      </div>
    </div>
  );
}

// Icons (Same as before but consistent)
const OverviewIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const FormsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>;
const InboxIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
