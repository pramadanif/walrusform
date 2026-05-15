"use client";

import React, { useEffect, useState, use } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { getSubmissionsForForm, FormSubmission, AdminMeta, saveAdminMeta } from '@/lib/submissionStorage';
import { getLocalFormRegistry, loadFormDefinition, FormDefinition } from '@/lib/formStorage';
import { getExplorerUrl } from '@/lib/walrus';
import AppBackground from '@/components/AppBackground';
import { decryptWithSeal } from '@/lib/seal';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { getFormRegistry } from '@/lib/formStorage';
import DOMPurify from 'dompurify';

interface PageProps {
  params: Promise<{ id: string }>;
}

type Submission = FormSubmission & AdminMeta & { _blobId?: string };

const STATUS_OPTIONS = ['New', 'In Review', 'Actioned', 'Archived'] as const;

export default function ResponseDetailPage({ params }: PageProps) {
  const { id: blobId } = use(params);
  const router = useRouter();
  const account = useCurrentAccount();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // blobId could be either a submission blob or a sub ID.
        // Strategy: scan all forms in registry, find the submission with matching _blobId
        const registry = await getFormRegistry(account?.address);
        const formIds = Object.keys(registry);

        let found: Submission | null = null;
        let foundForm: FormDefinition | null = null;

        for (const fid of formIds) {
          const subs = await getSubmissionsForForm(fid);
          const match = subs.find((s) => s._blobId === blobId || s.submissionId === blobId);
          if (match) {
            found = match;
            try { foundForm = await loadFormDefinition(fid); } catch { /* no form def */ }
            break;
          }
        }

        if (!found) {
          setError(`Submission not found in local registry. Blob ID: ${blobId}`);
        } else {
          let next = found;
          if (found.encrypted && (found.answers as { __sealed?: string })?.__sealed && foundForm) {
            const allowed = foundForm.settings.allowedDecryptors ?? [];
            if (allowed.length === 0) {
              setSealError('Seal policy missing.');
            } else if (!account?.address) {
              setSealError('Connect wallet to decrypt.');
            } else {
              try {
                const raw = await decryptWithSeal(
                  (found.answers as { __sealed: string }).__sealed,
                  allowed,
                  account.address
                );
                const payload = JSON.parse(raw) as { answers?: Record<string, unknown>; mediaBlobIds?: Record<string, string> };
                next = {
                  ...found,
                  answers: payload.answers ?? {},
                  mediaBlobIds: payload.mediaBlobIds ?? found.mediaBlobIds,
                };
              } catch (e: unknown) {
                setSealError(e instanceof Error ? e.message : 'Decrypt failed');
              }
            }
          }
          setSubmission(next);
          setFormDef(foundForm);
          setNoteInput(next.adminNote ?? '');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [blobId, account?.address]);

  const handleSaveNote = () => {
    if (!submission?._blobId) return;
    setSavingNote(true);
    saveAdminMeta(submission._blobId, { adminNote: noteInput });
    setSubmission((prev) => prev ? { ...prev, adminNote: noteInput } : prev);
    setSavingNote(false);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleStatusChange = (status: string) => {
    if (!submission?._blobId) return;
    const s = status as AdminMeta['status'];
    saveAdminMeta(submission._blobId, { status: s });
    setSubmission((prev) => prev ? { ...prev, status: s } : prev);
  };

  const copyBlobId = () => {
    if (!submission?._blobId) return;
    navigator.clipboard.writeText(submission._blobId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getFieldLabel = (fieldId: string) => {
    return formDef?.fields.find((f) => f.id === fieldId)?.label ?? fieldId;
  };

  // ── Loading / Error states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center relative">
        <AppBackground />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-10 h-10 rounded-full border-2 border-[#00E5CC] border-t-transparent animate-spin" />
          <p className="font-mono text-[#7A8CAB] text-xs">Loading submission from Walrus…</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center p-8 relative">
        <AppBackground />
        <div className="max-w-md text-center z-10">
          <div className="text-red-400 font-mono text-sm mb-4">{error ?? 'Submission not found'}</div>
          <button onClick={() => router.back()} className="text-[#00E5CC] font-mono text-xs hover:underline">← Back</button>
        </div>
      </div>
    );
  }

  // ── Main View ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      {/* Left Nav */}
      <aside className="w-[260px] glass-card !bg-white/2 !rounded-none border-y-0 border-l-0 p-6 flex flex-col">
        <div className="mb-12 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#00E5CC]">
            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-white font-syne font-bold text-sm tracking-tight">WalrusForm</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<OverviewIcon />} label="Overview" onClick={() => router.push('/dashboard')} />
          <NavItem icon={<FormsIcon />} label="My Forms" onClick={() => router.push('/builder')} />
          <NavItem icon={<InboxIcon />} label="Responses" active onClick={() => router.push('/dashboard')} />
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
              Dashboard / {formDef?.title ?? 'Form'} / <span className="text-white">Response</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status quick-set in header */}
            <select
              value={submission.status ?? 'New'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-[#00E5CC]/30"
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">

            {/* Left Column: Answer Content */}
            <div className="space-y-8">
              {sealError && (
                <GlassCard className="!p-8">
                  <label className="text-[10px] font-mono text-[#00E5CC] uppercase tracking-[0.2em] font-bold mb-4 block">
                    Encrypted Response
                  </label>
                  <p className="text-[#7A8CAB] font-mono text-sm">{sealError}</p>
                </GlassCard>
              )}
              {Object.entries(submission.answers ?? {}).map(([fieldId, value]) => {
                const label = getFieldLabel(fieldId);
                const isNumber = typeof value === 'number';
                const isBool = typeof value === 'boolean';

                return (
                  <GlassCard key={fieldId} className="!p-8">
                    <label className="text-[10px] font-mono text-[#00E5CC] uppercase tracking-[0.2em] font-bold mb-4 block">{label}</label>
                    {isNumber ? (
                      <div className="flex gap-2 text-[#00E5CC] text-2xl">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < value ? 'opacity-100' : 'opacity-20'}>★</span>
                        ))}
                        <span className="font-mono text-sm text-[#7A8CAB] ml-2 self-center">{value}/5</span>
                      </div>
                    ) : isBool ? (
                      <p className="text-lg text-white font-mono">{value ? 'Yes ✓' : 'No ✗'}</p>
                    ) : (
                      <p className="text-lg text-white font-mono leading-relaxed whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={typeof value === 'string' && value.startsWith('<') ? { __html: DOMPurify.sanitize(value) } : undefined}
                      >
                        {!(typeof value === 'string' && value.startsWith('<')) ? String(value ?? '') : undefined}
                      </p>
                    )}
                  </GlassCard>
                );
              })}

              {/* Media blobs */}
              {submission.mediaBlobIds && Object.entries(submission.mediaBlobIds).map(([fieldId, mediaBlobId]) => (
                <GlassCard key={fieldId} className="!p-8">
                  <label className="text-[10px] font-mono text-[#00E5CC] uppercase tracking-[0.2em] font-bold mb-4 block">
                    {getFieldLabel(fieldId)} (Media File)
                  </label>
                  <a
                    href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${mediaBlobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-[#00E5CC] font-mono text-sm underline flex items-center gap-2"
                  >
                    View on Walrus
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                  <div className="text-[10px] font-mono text-[#7A8CAB] mt-2 break-all">Blob: {mediaBlobId}</div>
                </GlassCard>
              ))}

              {Object.keys(submission.answers ?? {}).length === 0 && (
                <GlassCard className="!p-8">
                  <p className="text-[#7A8CAB] font-mono text-sm">No answer data available.</p>
                </GlassCard>
              )}
            </div>

            {/* Right Column: Metadata & Notes */}
            <div className="space-y-6">
              {/* Metadata */}
              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Metadata</h4>
                <div className="space-y-4">
                  <MetaItem label="Submitted" value={new Date(submission.submittedAt).toLocaleString()} />
                  <MetaItem label="Form" value={formDef?.title ?? submission.formBlobId?.slice(0, 20) + '…'} />
                  {submission.submitterWallet && (
                    <MetaItem label="Wallet" value={`${submission.submitterWallet.slice(0, 10)}…${submission.submitterWallet.slice(-4)}`} isCopyable copyValue={submission.submitterWallet} />
                  )}
                  {submission._blobId && (
                    <MetaItem label="Blob ID" value={`${submission._blobId.slice(0, 16)}…`} isCopyable copyValue={submission._blobId} />
                  )}
                </div>
                {submission._blobId && (
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={copyBlobId}
                      className="flex-1 py-2 border border-white/10 rounded-lg text-white font-mono text-xs hover:bg-white/5 transition-all"
                    >
                      {copied ? 'Copied ✓' : 'Copy Blob ID'}
                    </button>
                    <a
                      href={getExplorerUrl(submission._blobId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 border border-[#00E5CC]/30 rounded-lg text-[#00E5CC] font-mono text-xs hover:bg-[#00E5CC]/5 transition-all text-center"
                    >
                      Explorer →
                    </a>
                  </div>
                )}
              </GlassCard>

              {/* Status */}
              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Status & Priority</h4>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase transition-all ${
                          (submission.status ?? 'New') === s
                            ? 'bg-[#00E5CC]/10 text-[#00E5CC] border-[#00E5CC]/30'
                            : 'text-[#7A8CAB] border-white/10 hover:border-[#00E5CC]/20'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Admin Notes */}
              <GlassCard className="!p-6">
                <h4 className="text-[11px] font-mono font-bold text-[#7A8CAB] uppercase tracking-[0.1em] mb-4">Internal Notes</h4>
                <textarea
                  placeholder="Add a private note…"
                  rows={4}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-white outline-none focus:border-[#00E5CC]/30 resize-none mb-2"
                />
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="text-[10px] font-mono text-[#00E5CC] hover:underline disabled:opacity-50"
                  >
                    {savingNote ? 'Saving…' : 'Save Note'}
                  </button>
                  {savedNote && <span className="text-[10px] font-mono text-green-400">Saved ✓</span>}
                </div>
              </GlassCard>

              {/* Navigation */}
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 !py-3 !text-xs !border-white/5" onClick={() => router.back()}>← Back</Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${
        active ? 'bg-[#00E5CC]/5 text-white' : 'text-[#7A8CAB] hover:text-white hover:bg-white/[0.02]'
      }`}
    >
      {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-[#00E5CC] rounded-full" />}
      <div className={`${active ? 'text-[#00E5CC]' : 'group-hover:text-white'} transition-colors`}>{icon}</div>
      <span className="font-mono text-sm font-medium">{label}</span>
    </button>
  );
}

function MetaItem({ label, value, isCopyable, copyValue }: { label: string; value: string; isCopyable?: boolean; copyValue?: string }) {
  const [c, setC] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(copyValue ?? value).then(() => { setC(true); setTimeout(() => setC(false), 2000); });
  };
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="text-[10px] font-mono text-[#7A8CAB] uppercase shrink-0">{label}</div>
      <div className="text-right">
        <div className="text-[11px] text-white font-mono break-all">{value}</div>
        {isCopyable && (
          <button onClick={copy} className="text-[9px] text-[#00E5CC] hover:underline">{c ? 'Copied ✓' : 'Copy'}</button>
        )}
      </div>
    </div>
  );
}

// Icons
const OverviewIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>;
const FormsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>;
const InboxIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>;
const ChartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18 17v-4M13 17v-7M8 17v-4"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
