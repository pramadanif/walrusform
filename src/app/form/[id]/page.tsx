"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, use } from 'react';
import { GlassCard, Button, Badge } from '@/components/ui';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import { loadFormDefinition, FormDefinition } from '@/lib/formStorage';
import { submitForm } from '@/lib/submissionStorage';
import { encryptWithSeal } from '@/lib/seal';
import { RichTextInput } from '@/components/inputs/RichTextInput';
import { FileUploadInput } from '@/components/inputs/FileUploadInput';
import { getExplorerUrl } from '@/lib/walrus';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { getFormByBlobId, updateSubmissionIndexTx, getPoolForForm, claimRewardTx } from '@/lib/suiActions';
import Navbar from '@/components/Navbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicFormPage({ params }: PageProps) {
  const { id: blobId } = use(params);
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [formDef, setFormDef] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [mediaBlobIds, setMediaBlobIds] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submittedBlobId, setSubmittedBlobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formObjectId, setFormObjectId] = useState<string | null>(null);

  // Load form definition from Walrus on mount
  useEffect(() => {
    if (!blobId) return;
    setLoading(true);
    loadFormDefinition(blobId)
      .then(setFormDef)
      .catch((e) => setLoadError(e?.message ?? 'Failed to load form'))
      .finally(() => setLoading(false));

    getFormByBlobId(blobId).then((suiForm) => {
      if (suiForm?.objectId) {
        setFormObjectId(suiForm.objectId);
      }
    });
  }, [blobId]);

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[fieldId];
      } else {
        next[fieldId] = value;
      }
      return next;
    });
  };

  const [submitStage, setSubmitStage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDef) return;
    if (!account?.address) {
      setSubmitError('Please connect your wallet to submit this form.');
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitStage('preparing');
    try {
      let answersToSubmit = answers;
      let mediaToSubmit: Record<string, string> | undefined = mediaBlobIds;
      let encrypted = false;

      if (formDef.settings.encryptWithSeal) {
        const allowed = formDef.settings.allowedDecryptors ?? [];
        if (allowed.length === 0) {
          throw new Error('Seal policy has no approved wallets.');
        }
        const sealedPayload = await encryptWithSeal(
          JSON.stringify({ answers, mediaBlobIds }),
          allowed
        );
        answersToSubmit = { __sealed: sealedPayload };
        mediaToSubmit = undefined;
        encrypted = true;
      }

      const { submissionBlobId, newIndexBlobId } = await submitForm(
        blobId,
        answersToSubmit,
        mediaToSubmit,
        account?.address,
        { encrypted },
        (stage) => {
            if (stage === 'encrypting') setSubmitStage('Seal: Securing your feedback...');
            else if (stage === 'storing') setSubmitStage('Walrus: Storing immutable blob...');
            else if (stage === 'indexing') setSubmitStage('Walrus: Updating session index...');
            else setSubmitStage(stage);
        }
      );

      // Update index on-chain if we have the new pointer
      if (newIndexBlobId) {
        setSubmitStage('Sui: Updating on-chain index...');
        try {
          const suiForm = await getFormByBlobId(blobId);
          if (suiForm?.objectId) {
            signAndExecute({
              transaction: updateSubmissionIndexTx(suiForm.objectId, newIndexBlobId),
            }, {
              onSuccess: () => {
                console.log('[Form] On-chain index updated.');
                setSubmittedBlobId(submissionBlobId);
                setSubmitting(false);
                setSubmitStage('');
              },
              onError: (err) => {
                console.warn('[Form] Failed to update on-chain index:', err);
                setSubmitError('Failed to update on-chain index. But submission was saved on Walrus.');
                setSubmitting(false);
                setSubmitStage('');
              }
            });
          } else {
            setSubmittedBlobId(submissionBlobId);
            setSubmitting(false);
            setSubmitStage('');
          }
        } catch (e) {
          console.warn('[Form] Failed to fetch form object for index update:', e);
          setSubmittedBlobId(submissionBlobId);
          setSubmitting(false);
          setSubmitStage('');
        }
      } else {
        setSubmittedBlobId(submissionBlobId);
        setSubmitting(false);
        setSubmitStage('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubmitError(msg);
      setSubmitting(false);
      setSubmitStage('');
    }
  };

  const requiredCount = formDef?.fields.filter((f) => f.required).length ?? 1;
  const progress = (Object.keys(answers).length / Math.max(requiredCount, 1)) * 100;

  if (submittedBlobId) {
    return <SuccessState blobId={submittedBlobId} formObjectId={formObjectId || undefined} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative text-black">
        <AppBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-8 relative z-10"
        >
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-[#cdb4ff]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#4a2e8c] animate-spin" />
          </div>
          <p className="font-jakarta font-bold text-sm text-[#4a2e8c] uppercase tracking-[0.2em]">
            Fetching Session from Walrus…
          </p>
        </motion.div>
      </div>
    );
  }

  if (loadError || !formDef) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative text-black">
        <AppBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <GlassCard className="!p-12 !bg-white/95 !rounded-[48px] border-white shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="font-syne font-extrabold text-3xl text-black mb-4 tracking-tight">Session Missing</h2>
            <p className="font-jakarta text-gray-400 mb-6 leading-relaxed">{loadError}</p>
            <div className="p-4 bg-gray-50 rounded-2xl font-mono text-[10px] text-[#4a2e8c] break-all border border-black/5">
              {blobId}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 px-4 relative text-black">
      <AppBackground />
      <Navbar />
      
      <div className="max-w-[720px] mx-auto relative z-10">
        <motion.header 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-16 relative"
        >
          <div className="flex justify-between items-start mb-10">
            <div className="flex-1 pr-8">
              <div className="mb-4">
                <Badge color="purple">Live Session</Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-syne font-extrabold mb-4 text-black tracking-tight leading-tight">{formDef.title}</h1>
              {formDef.description && (
                <p className="text-gray-500 font-jakarta font-medium text-lg leading-relaxed">{formDef.description}</p>
              )}
            </div>
            <div className="glass-card !bg-white/90 !px-4 !py-2 !rounded-full border-white/40 shadow-xl hidden sm:block shrink-0">
              <span className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                Storage: Walrus
              </span>
            </div>
          </div>

          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              className="h-full bg-gradient-to-r from-[#4a2e8c] to-[#cdb4ff] shadow-[0_0_15px_rgba(74,46,140,0.3)]"
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="font-jakarta font-bold text-[10px] text-[#4a2e8c] uppercase tracking-widest">Progress</span>
            <span className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
          </div>
        </motion.header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {formDef.fields.map((field, i) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <GlassCard className="!p-10 !bg-white/90 !rounded-[40px] border-white shadow-xl hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#4a2e8c] text-white flex items-center justify-center font-syne font-bold text-xs">
                    {i + 1}
                  </div>
                  <label className="font-outfit font-bold text-lg text-black">
                    {field.label}{' '}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>

                {/* Rich Text / plain text */}
                {(field.type === 'richtext' || field.type === 'text') && (
                  field.type === 'richtext' ? (
                    <div className="bg-gray-50/50 rounded-3xl border border-black/5 p-2 shadow-inner focus-within:bg-white focus-within:border-[#cdb4ff] transition-all">
                      <RichTextInput
                        onChange={(html) => setAnswer(field.id, html)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    </div>
                  ) : (
                    <textarea
                      placeholder={field.placeholder}
                      rows={4}
                      required={field.required}
                      onChange={(e) => setAnswer(field.id, e.target.value)}
                      className="w-full bg-gray-50/50 border border-black/5 rounded-[32px] px-8 py-6 font-jakarta font-medium text-black outline-none focus:border-[#cdb4ff] focus:bg-white focus:ring-[12px] focus:ring-[#cdb4ff]/10 transition-all placeholder:text-gray-300 shadow-inner resize-none text-lg"
                    />
                  )
                )}

                {/* Dropdown */}
                {field.type === 'dropdown' && (
                  <div className="relative group">
                    <select
                      required={field.required}
                      onChange={(e) => setAnswer(field.id, e.target.value)}
                      className="w-full bg-gray-50/50 border border-black/5 rounded-[32px] px-8 py-6 font-jakarta font-bold text-black outline-none focus:border-[#cdb4ff] focus:bg-white focus:ring-[12px] focus:ring-[#cdb4ff]/10 transition-all shadow-inner appearance-none cursor-pointer text-lg"
                    >
                      <option value="">— Select an option —</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <svg className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4a2e8c] transition-colors pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                )}

                {/* Checkbox / Confirmation */}
                {(field.type === 'checkbox' || field.type === 'confirmation' || field.type === 'confirm') && (
                  <label className="flex items-center gap-4 cursor-pointer group p-6 bg-gray-50/50 rounded-[32px] border border-black/5 hover:bg-white hover:border-[#cdb4ff] transition-all">
                    <input
                      type="checkbox"
                      required={field.required}
                      onChange={(e) => setAnswer(field.id, e.target.checked)}
                      className="w-6 h-6 rounded-xl border-gray-300 bg-white text-[#4a2e8c] focus:ring-[#cdb4ff]/20 transition-all"
                    />
                    <span className="font-jakarta font-bold text-[15px] text-gray-600 group-hover:text-black transition-colors">
                      {field.placeholder ?? (field.type === 'checkbox' ? 'I agree to the above' : field.label)}
                    </span>
                  </label>
                )}

                {/* Star Rating */}
                {(field.type === 'starrating' || field.type === 'rating') && (
                  <div className="p-8 bg-gray-50/50 rounded-[32px] border border-black/5">
                    <RatingInput onChange={(val) => setAnswer(field.id, val)} />
                  </div>
                )}

                {/* File Uploads */}
                {(field.type === 'screenshot' || field.type === 'video') && (
                  <FileUploadInput
                    type={field.type as 'screenshot' | 'video'}
                    onUploadComplete={(id) => {
                      setAnswer(field.id, id);
                      setMediaBlobIds((prev) => ({ ...prev, [field.id]: id }));
                    }}
                    onClear={() => {
                      setAnswer(field.id, undefined);
                      setMediaBlobIds((prev) => { const n = { ...prev }; delete n[field.id]; return n; });
                    }}
                  />
                )}

                {/* URL */}
                {field.type === 'url' && (
                  <input
                    type="url"
                    placeholder={field.placeholder ?? 'https://'}
                    required={field.required}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    className="w-full bg-gray-50/50 border border-black/5 rounded-[32px] px-8 py-6 font-jakarta font-bold text-black outline-none focus:border-[#cdb4ff] focus:bg-white focus:ring-[12px] focus:ring-[#cdb4ff]/10 transition-all shadow-inner text-lg"
                  />
                )}
              </GlassCard>
            </motion.div>
          ))}

          <AnimatePresence>
            {submitError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 font-jakarta font-bold text-sm text-center px-6 py-4 bg-red-50 rounded-2xl border border-red-100"
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            variant="purple"
            loading={submitting}
            className="w-full !py-8 !text-2xl !rounded-[40px] mt-12 shadow-[0_32px_64px_-16px_rgba(74,46,140,0.4)] hover:scale-[1.02]"
            icon={!submitting && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          >
            {submitting 
              ? (submitStage || 'Sending…') 
              : 'Submit Session'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RatingInput({ onChange }: { onChange: (val: number) => void }) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  return (
    <div className="flex gap-4 justify-center sm:justify-start">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.button
          key={s}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => { setRating(s); onChange(s); }}
          className={`w-16 h-16 rounded-[24px] border-2 flex items-center justify-center transition-all ${
            (hover || rating) >= s
              ? 'bg-[#cdb4ff]/20 border-[#4a2e8c] text-[#4a2e8c] shadow-lg'
              : 'bg-white border-black/5 text-gray-200'
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill={(hover || rating) >= s ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </motion.button>
      ))}
    </div>
  );
}

function SuccessState({ blobId, formObjectId }: { blobId: string, formObjectId?: string }) {
  const [copied, setCopied] = useState(false);
  const [poolObjectId, setPoolObjectId] = useState<string | null>(null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (formObjectId) {
      getPoolForForm(formObjectId).then(setPoolObjectId);
    }
  }, [formObjectId]);

  const handleClaim = () => {
    if (!poolObjectId) return;
    const tx = claimRewardTx(poolObjectId);
    signAndExecute({ transaction: tx }, {
      onSuccess: () => alert('Reward claimed successfully!'),
      onError: (e) => alert('Failed to claim reward: ' + e.message),
    });
  };

  const copy = () => {
    navigator.clipboard.writeText(blobId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center relative overflow-hidden">
      <AppBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[520px] w-full relative z-10"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 flex justify-center text-[#4a2e8c]"
        >
          <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl border border-white/40">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </motion.div>
        
        <h1 className="text-5xl font-syne font-extrabold mb-6 tracking-tight">Session Recorded</h1>
        <p className="text-gray-500 font-jakarta font-bold text-lg mb-16 max-w-sm mx-auto">Your feedback is now a permanent part of the Walrus Protocol.</p>

        <GlassCard className="!p-10 !bg-white/95 !rounded-[48px] mb-12 text-left border-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                  Verification Blob ID
                </div>
                <div className="font-mono text-sm text-[#4a2e8c] break-all bg-[#4a2e8c]/5 p-6 rounded-3xl border border-[#4a2e8c]/10">
                  {blobId}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <Button
                variant="ghost"
                onClick={copy}
                className="flex-1 !py-4 font-bold !bg-white border-black/5"
              >
                {copied ? 'Copied ✓' : 'Copy ID'}
              </Button>
              <a
                href={getExplorerUrl(blobId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="purple" className="w-full !py-4 font-bold shadow-xl">Explorer</Button>
              </a>
            </div>

            {poolObjectId && (
              <Button
                variant="primary"
                onClick={handleClaim}
                className="w-full !py-4 font-bold !bg-[#4a2e8c] text-white mt-4 shadow-xl flex items-center justify-center"
              >
                <div className="flex items-center gap-2">
                  <svg className="inline-block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  <span>Claim SUI Reward</span>
                </div>
              </Button>
            )}
          </div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Image src="/form.png" alt="Mascot" fill className="object-contain" />
          </div>
        </GlassCard>
        
        <button
          onClick={() => window.location.reload()}
          className="font-jakarta font-bold text-sm text-[#4a2e8c] hover:underline transition-all opacity-50 hover:opacity-100"
        >
          Submit Another Response
        </button>
      </motion.div>
    </div>
  );
}

