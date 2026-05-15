"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { getFormRegistry, loadFormDefinition, FormDefinition } from '@/lib/formStorage';
import { getSubmissionsForForm, saveAdminMeta, AdminMeta, FormSubmission } from '@/lib/submissionStorage';
import { exportSubmissionsToCSV } from '@/lib/csvExport';
import { getExplorerUrl } from '@/lib/walrus';
import { decryptWithSeal } from '@/lib/seal';
import { useCurrentAccount } from '@mysten/dapp-kit';
import DOMPurify from 'dompurify';

type Submission = FormSubmission & AdminMeta & { _blobId?: string; _formTitle?: string; _decrypted?: boolean; _sealError?: string };

const STATUS_OPTIONS = ['New', 'In Review', 'Actioned', 'Archived'] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [responses, setResponses] = useState<Submission[]>([]);
  const [forms, setForms] = useState<(FormDefinition & { _blobId: string })[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | 'all'>('all');
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<Submission | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const account = useCurrentAccount();

  // Load all submissions from all forms in registry
  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoadingResponses(true);
      try {
        const registry = await getFormRegistry();
        const formIds = Object.keys(registry);

        if (formIds.length === 0) {
          if (active) setResponses([]);
          return;
        }

        const formDefs = await Promise.allSettled(
          formIds.map((id) => loadFormDefinition(id).then((form) => ({ ...form, _blobId: id })))
        );
        const loadedForms = formDefs
          .filter((r): r is PromiseFulfilledResult<FormDefinition & { _blobId: string }> => r.status === 'fulfilled')
          .map((r) => r.value);
        if (active) setForms(loadedForms);

        const formByBlobId = Object.fromEntries(
          loadedForms.map((form) => [form._blobId, form])
        );

        const allSubsPerForm = await Promise.allSettled(
          formIds.map((fid) => getSubmissionsForForm(fid).then(async (subs) => {
            const form = formByBlobId[fid];
            const allowed = form?.settings.allowedDecryptors ?? [];
            return Promise.all(subs.map(async (sub) => {
              const base: Submission = {
                ...sub,
                _formTitle: registry[fid]?.title ?? fid,
              };
              if (!sub.encrypted || !(sub.answers as { __sealed?: string })?.__sealed) {
                return base;
              }
              if (allowed.length === 0) {
                return { ...base, _sealError: 'Seal policy missing.' };
              }
              if (!account?.address) {
                return { ...base, _sealError: 'Connect wallet to decrypt.' };
              }
              try {
                const raw = await decryptWithSeal(
                  (sub.answers as { __sealed: string }).__sealed,
                  allowed,
                  account.address
                );
                const payload = JSON.parse(raw) as { answers?: Record<string, unknown>; mediaBlobIds?: Record<string, string> };
                return {
                  ...base,
                  answers: payload.answers ?? {},
                  mediaBlobIds: payload.mediaBlobIds ?? base.mediaBlobIds,
                  _decrypted: true,
                };
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Decrypt failed';
                return { ...base, _sealError: msg };
              }
            }));
          }))
        );

        const all: Submission[] = (allSubsPerForm
          .filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<Submission[]>[])
          .flatMap((r) => r.value)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        if (active) setResponses(all);
      } catch {
        // silent
      } finally {
        if (active) setLoadingResponses(false);
      }
    };
    loadAll();
    return () => { active = false; };
  }, [account?.address]);

  const filtered = responses.filter((r) => {
    const inForm = selectedFormId === 'all' || r.formBlobId === selectedFormId;
    const query = searchQuery.toLowerCase();
    const textMatch =
      !query ||
      r.submissionId?.toLowerCase().includes(query) ||
      r.submitterWallet?.toLowerCase().includes(query) ||
      r._blobId?.toLowerCase().includes(query) ||
      JSON.stringify(r.answers).toLowerCase().includes(query);
    return inForm && textMatch;
  });

  // Stats
  const totalResponses = responses.length;
  const ratingValues = responses
    .flatMap((r) => Object.values(r.answers ?? {}).filter((v) => typeof v === 'number' && v >= 1 && v <= 5) as number[]);
  const avgRating = ratingValues.length > 0
    ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
    : '—';
  const blobCount = responses.filter((r) => r._blobId).length;

  const handleSaveNote = async () => {
    if (!selectedResponse?._blobId) return;
    setSavingNote(true);
    saveAdminMeta(selectedResponse._blobId, { adminNote: noteInput });
    setResponses((prev) =>
      prev.map((r) => r._blobId === selectedResponse._blobId ? { ...r, adminNote: noteInput } : r)
    );
    setSelectedResponse((prev) => prev ? { ...prev, adminNote: noteInput } : prev);
    setSavingNote(false);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleStatusChange = (status: string) => {
    if (!selectedResponse?._blobId) return;
    const s = status as AdminMeta['status'];
    saveAdminMeta(selectedResponse._blobId, { status: s });
    setResponses((prev) =>
      prev.map((r) => r._blobId === selectedResponse._blobId ? { ...r, status: s } : r)
    );
    setSelectedResponse((prev) => prev ? { ...prev, status: s } : prev);
  };

  const handleArchive = () => handleStatusChange('Archived');

  const handleExportCSV = () => {
    const formToExport = forms.find((f) => f._blobId === selectedFormId) ?? forms[0];
    if (!formToExport) return;
    const subsForForm = responses.filter((r) => r.formBlobId === formToExport._blobId);
    exportSubmissionsToCSV(formToExport, subsForForm);
  };

  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (now === 0) return 'just now';
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
        <AppBackground />
        <Navbar />

        <main className="max-w-[1400px] mx-auto px-8 pt-44 pb-20 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h1 className="text-6xl font-syne font-extrabold text-black mb-4 tracking-tight">Dashboard</h1>
              <p className="text-gray-500 font-jakarta font-bold text-sm uppercase tracking-widest">Managing your decentralized sessions</p>
            </motion.div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <div className="glass-card !py-2.5 !px-6 !rounded-full border-black/5 flex items-center gap-4 bg-white/60">
                <span className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">Filter:</span>
                <select
                  className="bg-transparent font-jakarta font-bold text-[13px] outline-none cursor-pointer text-[#4a2e8c]"
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value as string)}
                >
                  <option value="all">All Sessions</option>
                  {forms.map((form) => (
                    <option key={form._blobId} value={form._blobId}>{form.title}</option>
                  ))}
                </select>
              </div>
              <Button variant="ghost" onClick={handleExportCSV} className="shadow-sm border-black/5 !px-8">
                Export
              </Button>
              <Button variant="purple" onClick={() => router.push('/builder')} className="shadow-2xl !px-10">New Session +</Button>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <StatCard label="Total Responses" value={String(totalResponses)} icon={<FormsIcon />} color="#cdb4ff" />
            <StatCard label="Walrus Blobs" value={String(blobCount)} icon={<InboxIcon />} color="#e0f2fe" />
            <StatCard label="Avg Rating" value={avgRating} icon={<OverviewIcon />} color="#fae8ff" />
            <StatCard label="Active Forms" value={String(forms.length)} icon={<ChartIcon />} color="#dcfce7" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main List */}
            <div className="lg:col-span-2">
              <GlassCard className="!p-0 overflow-hidden !bg-white/80 !rounded-[48px] border-white shadow-2xl relative">
                <div className="p-10 border-b border-black/[0.03] flex justify-between items-center bg-white/40">
                  <h3 className="text-2xl font-outfit font-bold">Recent Submissions</h3>
                  <div className="flex gap-4 items-center">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Search feedback…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50/50 backdrop-blur-sm border border-black/5 rounded-full px-6 py-2.5 pl-12 font-jakarta text-sm outline-none focus:border-[#cdb4ff] focus:bg-white transition-all w-64 shadow-inner"
                      />
                      <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4a2e8c] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                      </svg>
                    </div>
                  </div>
                </div>

                {loadingResponses ? (
                  <div className="p-24 flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-[#cdb4ff]/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-[#4a2e8c] animate-spin" />
                    </div>
                    <p className="font-jakarta font-bold text-[11px] text-[#4a2e8c] uppercase tracking-[0.2em]">Syncing with Walrus…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-24 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-black/5">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    </div>
                    <h4 className="font-outfit font-bold text-xl mb-2 text-gray-400">Quiet in here…</h4>
                    <p className="font-jakarta text-gray-400 text-sm max-w-xs mx-auto">Deploy a form and share the link to start collecting decentralized feedback.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/[0.02] bg-black/[0.01]">
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-10">Response ID</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Session Title</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right pr-10">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.01]">
                        {filtered.map((resp, i) => (
                          <motion.tr
                            key={resp._blobId ?? resp.submissionId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => {
                              setSelectedResponse(resp);
                              setNoteInput(resp.adminNote ?? '');
                              setSavedNote(false);
                            }}
                            className="hover:bg-[#4a2e8c]/5 cursor-pointer group transition-all"
                          >
                            <td className="p-6 pl-10">
                              <div className="flex flex-col">
                                <span className="font-jakarta font-bold text-[13px] text-black group-hover:text-[#4a2e8c]">
                                  {resp._blobId?.slice(0, 12) ?? resp.submissionId?.slice(0, 12)}…
                                </span>
                                <span className="text-[10px] text-gray-400 font-jakarta font-bold uppercase tracking-wider">{formatDate(resp.submittedAt)}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-jakarta font-bold text-[13px] text-gray-600 truncate max-w-[150px] block">
                                {resp._formTitle}
                              </span>
                            </td>
                            <td className="p-6">
                              <Badge color={resp.status === 'Actioned' ? 'green' : resp.status === 'In Review' ? 'purple' : resp.status === 'Archived' ? 'gray' : 'blue'}>
                                {resp.status ?? 'New'}
                              </Badge>
                            </td>
                            <td className="p-6 text-right pr-10">
                              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center ml-auto group-hover:bg-[#4a2e8c] group-hover:text-white transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <GlassCard className="!p-10 !bg-[#4a2e8c] !text-white !rounded-[48px] relative overflow-hidden group border-none shadow-[0_32px_64px_-16px_rgba(74,46,140,0.3)]">
                <div className="relative z-10">
                  <Badge color="purple" className="!bg-white/20 !text-white !border-white/20 !mb-6">Advanced</Badge>
                  <h3 className="text-3xl font-syne font-extrabold mb-4">Walrus Node</h3>
                  <p className="text-white/60 font-jakarta text-[15px] leading-relaxed mb-10">Host your own storage node for maximum speed and control over your session data.</p>
                  <Button
                    variant="ghost"
                    className="w-full !bg-white !text-[#4a2e8c] font-extrabold !py-4 hover:scale-[1.02]"
                    onClick={() => window.open('https://docs.walrus.site/', '_blank')}
                  >
                    Configure Node
                  </Button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000">
                  <Image src="/wal-footer.avif" alt="Mascot" fill className="object-contain" />
                </div>
              </GlassCard>

              <GlassCard className="!p-10 !bg-white/80 !rounded-[48px] border-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-outfit font-bold">Live Activity</h3>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="space-y-8">
                  {responses.slice(0, 4).map((r, i) => (
                    <motion.div 
                      key={r._blobId ?? r.submissionId} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex gap-4 items-start"
                    >
                      <div className="w-1.5 h-10 bg-[#cdb4ff] rounded-full shrink-0 mt-1" />
                      <div>
                        <div className="font-jakarta font-bold text-[14px] text-black">New Feedback</div>
                        <div className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-widest">{formatDate(r.submittedAt)}</div>
                      </div>
                    </motion.div>
                  ))}
                  {responses.length === 0 && (
                    <p className="font-jakarta text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-10">Waiting for data…</p>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </main>

        {/* Slide-over Detail Panel */}
        <AnimatePresence>
          {selectedResponse && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedResponse(null)}
                className="fixed inset-0 bg-black/20 backdrop-blur-md z-[110]"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="fixed top-8 bottom-8 right-8 w-[520px] glass-card !bg-white !rounded-[56px] z-[120] p-12 flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-white overflow-hidden"
              >
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <Badge color="purple" className="mb-4">Session Response</Badge>
                    <h3 className="text-4xl font-syne font-extrabold tracking-tight">Detail View</h3>
                    <div className="text-gray-400 font-jakarta font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                      {selectedResponse._blobId ?? selectedResponse.submissionId}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white transition-all border border-black/5 shadow-sm"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-10 custom-scrollbar pr-4">
                  <DetailItem label="Session Title" value={selectedResponse._formTitle ?? 'Unknown'} />
                  <DetailItem label="Timestamp" value={new Date(selectedResponse.submittedAt).toLocaleString()} />

                  {/* Answers Section */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em]">Response Data</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(selectedResponse.answers ?? {}).map(([k, v]) => (
                        <div key={k} className="p-6 rounded-[32px] bg-gray-50/50 border border-black/5">
                          <div className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-2">{k}</div>
                          <div className="font-jakarta font-bold text-[15px] text-gray-800 break-words whitespace-pre-wrap"
                               dangerouslySetInnerHTML={typeof v === 'string' && v.startsWith('<') ? { __html: DOMPurify.sanitize(v) } : undefined}
                          >
                            {!(typeof v === 'string' && v.startsWith('<')) ? (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '—')) : undefined}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Media Section */}
                  {selectedResponse.mediaBlobIds && Object.keys(selectedResponse.mediaBlobIds).length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em]">Media Attachments</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(selectedResponse.mediaBlobIds).map(([k, id]) => (
                          <a 
                            key={k} 
                            href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-6 rounded-[32px] bg-[#4a2e8c]/5 border border-[#4a2e8c]/10 flex items-center justify-between group hover:bg-[#4a2e8c]/10 transition-all"
                          >
                            <div>
                              <div className="text-[10px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest mb-1">{k}</div>
                              <div className="text-[11px] font-mono text-gray-400 truncate max-w-[200px]">{id}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4a2e8c] shadow-sm group-hover:scale-110 transition-transform">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Controls */}
                  <div className="pt-10 space-y-8">
                    <div className="space-y-4">
                      <label className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em] block">Status Update</label>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`px-5 py-2.5 rounded-full border font-jakarta font-bold text-[11px] uppercase tracking-widest transition-all ${
                              (selectedResponse.status ?? 'New') === s
                                ? 'bg-[#4a2e8c] text-white border-[#4a2e8c] shadow-lg scale-105'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-[#cdb4ff] hover:text-[#4a2e8c]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-gray-900 rounded-[40px] text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-all" />
                      <label className="text-[10px] font-jakarta font-bold text-white/40 uppercase tracking-[0.2em] mb-4 block">Internal Analysis Note</label>
                      <textarea
                        className="w-full bg-transparent border-none outline-none font-jakarta text-[14px] text-white/90 resize-none placeholder:text-white/20"
                        rows={4}
                        placeholder="Add private team notes here…"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                      />
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="text-[11px] font-jakarta font-bold text-[#cdb4ff] hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingNote ? 'Processing…' : 'Sync Note'}
                          {!savingNote && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                        </button>
                        <AnimatePresence>
                          {savedNote && (
                            <motion.span 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-[11px] font-jakarta font-bold text-green-400"
                            >
                              Saved ✓
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-black/5 flex gap-4 mt-auto">
                  <Button variant="ghost" className="flex-1 !py-5 !rounded-full font-extrabold border-black/5" onClick={handleArchive}>Archive</Button>
                  <a 
                    href={getExplorerUrl(selectedResponse._blobId ?? '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      variant="purple"
                      className="w-full !py-5 !rounded-full shadow-2xl font-extrabold"
                    >
                      View on Walrus
                    </Button>
                  </a>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
    >
      <GlassCard className="!p-10 relative overflow-hidden group !bg-white/90 !rounded-[48px] border-white shadow-xl transition-all h-full">
        <div className="flex justify-between items-start mb-6">
          <div 
            className="w-16 h-16 rounded-[24px] flex items-center justify-center text-[#4a2e8c] group-hover:scale-110 transition-transform duration-500 shadow-inner"
            style={{ backgroundColor: `${color}60` }}
          >
            {icon}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</div>
          <div className="text-4xl font-syne font-extrabold text-black tracking-tight">{value}</div>
        </div>
        <div 
          className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: color }}
        />
      </GlassCard>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-4">
      <label className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em] block">{label}</label>
      <div className="text-[16px] text-gray-800 font-jakarta font-bold bg-gray-50/50 border border-black/[0.03] rounded-[32px] p-8 shadow-inner whitespace-pre-wrap break-words">
        {value}
      </div>
    </div>
  );
}

// Icons
const OverviewIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const FormsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>;
const InboxIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>;
const ChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;

