"use client";

import React, { useState, useMemo } from 'react';
import { GlassCard, Button, Input, Badge } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { saveFormDefinition, FormDefinition, FormField, getSealWallets } from '@/lib/formStorage';
import { getExplorerUrl, uploadToWalrus } from '@/lib/walrus';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createFormTx, setupTeamAndSealTx, createIncentivizedFormTx } from '@/lib/suiActions';

const FIELD_TYPES = [
  { id: 'richtext', label: 'Rich Text', icon: 'T', color: '#cdb4ff' },
  { id: 'dropdown', label: 'Dropdown', icon: '▼', color: '#e0f2fe' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑', color: '#dcfce7' },
  { id: 'starrating', label: 'Star Rating', icon: '★', color: '#fae8ff' },
  { id: 'screenshot', label: 'Screenshot', icon: '🖼', color: '#f5f3ff' },
  { id: 'video', label: 'Video Upload', icon: '▶', color: '#ecfeff' },
  { id: 'url', label: 'URL Link', icon: '🔗', color: '#f0f4ff' },
  { id: 'confirmation', label: 'Confirmation', icon: '✓', color: '#e6f0ff' },
];

// Using getSealWallets from @/lib/formStorage

export default function BuilderPage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const searchParams = useSearchParams();

  const initialDraft = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const templateId = searchParams.get('template');
    if (!templateId) return null;
    const draftRaw = localStorage.getItem('walrusform_template_draft');
    if (!draftRaw) return null;
    try {
      return JSON.parse(draftRaw) as { title: string; description?: string; fields: FormField[] };
    } catch {
      return null;
    } finally {
      localStorage.removeItem('walrusform_template_draft');
    }
  }, [searchParams]);

  const [formTitle, setFormTitle] = useState(() => initialDraft?.title ?? 'Untitled Session');
  const [formDescription, setFormDescription] = useState(() => initialDraft?.description ?? '');
  const [fields, setFields] = useState<FormField[]>(() => initialDraft?.fields ?? []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    () => initialDraft?.fields?.[0]?.id ?? null
  );
  const [dropdownOptionsInput, setDropdownOptionsInput] = useState(() => {
    const first = initialDraft?.fields?.[0];
    return first?.type === 'dropdown' ? (first.options ?? []).join('\n') : '';
  });

  // Deploy state
  const [isDeploying, setIsDeploying] = useState(false);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployedBlobId, setDeployedBlobId] = useState<string | null>(null);
  const [deployStage, setDeployStage] = useState<'idle' | 'walrus' | 'sui'>('idle');
  const [activityLog, setActivityLog] = useState<{msg: string, type: 'seal' | 'walrus' | 'sui' | 'done'}[]>([]);
  const [sealEnabled, setSealEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return JSON.parse(localStorage.getItem('walrusform_seal_wallets') ?? '[]').length > 0; } catch { return false; }
  });
  const [sealWalletInput, setSealWalletInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try { return (JSON.parse(localStorage.getItem('walrusform_seal_wallets') ?? '[]') as string[]).join('\n'); } catch { return ''; }
  });
  const [incentivesEnabled, setIncentivesEnabled] = useState(false);
  const [rewardPerResponse, setRewardPerResponse] = useState('0.1'); // in SUI
  const [maxResponses, setMaxResponses] = useState('100');

  const toggleSeal = (val: boolean) => {
    setSealEnabled(val);
    if (!val) {
      localStorage.setItem('walrusform_seal_wallets', '[]');
    } else {
      // Save current wallet input if any
      const wallets = sealWalletInput.split('\n').map(w => w.trim()).filter(Boolean);
      localStorage.setItem('walrusform_seal_wallets', JSON.stringify(wallets));
    }
  };

  const saveSealWallets = (raw: string) => {
    setSealWalletInput(raw);
    const wallets = raw.split('\n').map(w => w.trim()).filter(Boolean);
    localStorage.setItem('walrusform_seal_wallets', JSON.stringify(wallets));
  };

  const addLog = (msg: string, type: 'seal' | 'walrus' | 'sui' | 'done') => {
    setActivityLog(prev => [...prev, { msg, type }].slice(-5));
  };
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const router = useRouter();

  const addField = (type: typeof FIELD_TYPES[0]) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: type.id as FormField['type'],
      label: `${type.label} Question`,
      required: false,
      placeholder: '',
      options: type.id === 'dropdown' ? ['Option A', 'Option B'] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setDropdownOptionsInput(type.id === 'dropdown' ? 'Option A\nOption B' : '');
  };

  const deleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) selectField(null);
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const selectField = (field: FormField | null) => {
    setSelectedFieldId(field?.id ?? null);
    setDropdownOptionsInput(field?.type === 'dropdown' ? (field.options ?? []).join('\n') : '');
  };

  // ── Deploy to Walrus ────────────────────────────────────────────────────────
  const handleDeployToWalrus = async () => {
    setDeployError(null);
    if (!formTitle.trim()) {
      setDeployError('Please add a title before deploying.');
      return;
    }
    if (fields.length === 0) {
      setDeployError('Add at least one field before deploying.');
      return;
    }

    setIsDeploying(true);
    setDeployStage('walrus');
    setActivityLog([]); // Reset logs
    
    try {
      const sealWallets = getSealWallets();
      const encryptWithSeal = sealWallets.length > 0;

      const form: FormDefinition = {
        id: crypto.randomUUID(),
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        fields,
        createdAt: new Date().toISOString(),
        settings: {
          requireWallet: false,
          encryptWithSeal,
          allowedDecryptors: encryptWithSeal ? sealWallets : undefined,
        },
      };

      // 1. Seal Encryption/Setup
      if (encryptWithSeal) {
        addLog("Encrypting form definition with Seal SDK...", "seal");
        addLog("Form metadata secured.", "seal");
      }

      // 2. Walrus Storage
      addLog("Storing immutable blob on Walrus...", "walrus");
      const blobId = await saveFormDefinition(form);
      addLog(`Blob stored: ${blobId.substring(0, 8)}...`, "walrus");
      
      // 3. Sui Registration
      if (account?.address) {
        setDeployStage('sui');
        addLog("Registering on Sui Testnet...", "sui");
        
        // Build the allowed decryptors list from current UI state
        const decryptorList = sealWalletInput.split('\n').map(w => w.trim()).filter(Boolean);
        
        const tx = incentivesEnabled 
          ? createIncentivizedFormTx(
              form.title, 
              blobId, 
              "", 
              BigInt(parseFloat(rewardPerResponse) * 1_000_000_000), 
              parseInt(maxResponses)
            )
          : createFormTx(form.title, blobId, "");

        signAndExecute({
          transaction: tx,
        }, {
          onSuccess: async (result) => {
            addLog("Waiting for transaction confirmation...", "sui");
            const txData = await client.waitForTransaction({
              digest: result.digest,
              options: { showObjectChanges: true },
            });
            
            // Extract the formObjectId from the created objects
            const createdObj = txData.objectChanges?.find(
              (o: any) => o.type === 'created' && o.objectType?.includes('::worm::Form')
            );
            const formObjectId = (createdObj as any)?.objectId;

            const link = `${window.location.origin}/form/${blobId}`;
            setDeployedBlobId(blobId);
            setShareableLink(link);
            addLog("On-chain registration confirmed.", "sui");

            // If Seal is enabled, register the access policy on-chain
            if (sealEnabled && decryptorList.length > 0 && formObjectId) {
              addLog(`Registering Seal policy and Team for ${decryptorList.length} member(s)...`, "seal");
              signAndExecute({
                transaction: setupTeamAndSealTx(formObjectId, decryptorList),
              }, {
                onSuccess: () => {
                  addLog("Seal policy and Team registered on-chain. ✓", "done");
                  setDeployStage('idle');
                  setIsDeploying(false);
                },
                onError: (err) => {
                  console.warn('[Builder] seal_approve failed:', err);
                  addLog("Seal policy tx failed — Walrus blob still secured.", "seal");
                  setDeployStage('idle');
                  setIsDeploying(false);
                }
              });
            } else {
              addLog("System ready.", "done");
              setDeployStage('idle');
              setIsDeploying(false);
            }
          },
          onError: (err) => {
            console.error(err);
            setIsDeploying(false);
            setDeployStage('idle');
            addLog("Sui registration failed.", "sui");
            setDeployError(`Sui Registration Failed: ${err.message}`);
          }
        });
      } else {
        const link = `${window.location.origin}/form/${blobId}`;
        setDeployedBlobId(blobId);
        setShareableLink(link);
        setIsDeploying(false);
        setDeployStage('idle');
        addLog("Deployment complete (unregistered).", "done");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deployment failed';
      setDeployError(msg);
      setIsDeploying(false);
      setDeployStage('idle');
      addLog("Deployment failed.", "walrus");
    }
  };

  const copyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="h-screen flex flex-col relative text-black bg-[#e6f0ff] overflow-hidden">
      <AppBackground />
      <Navbar />

      <div className="flex flex-col h-full relative z-10 pt-32">
        {/* Top Action Bar */}
        <header className="px-12 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-transparent border-none outline-none font-syne font-bold text-2xl text-black w-full max-w-md focus:text-[#4a2e8c] transition-colors placeholder:text-black/10 tracking-tight"
                  placeholder="Enter session title…"
                />
                <div className="flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-black/5 shadow-sm shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${deployedBlobId ? 'bg-green-500' : 'bg-[#4a2e8c]'} animate-pulse`} />
                  <span className="font-jakarta font-bold text-[9px] text-gray-400 uppercase tracking-widest">
                    {deployedBlobId ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              className="!px-8 !py-4 !text-sm !bg-white/40 border-white/60"
              onClick={() => {
                if (deployedBlobId) router.push(`/form/${deployedBlobId}`);
              }}
              disabled={!deployedBlobId}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
            >
              Preview
            </Button>
            <Button
              variant="purple"
              onClick={handleDeployToWalrus}
              loading={isDeploying}
              className="!px-10 !py-4 !text-sm shadow-[0_20px_40px_-10px_rgba(74,46,140,0.3)]"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" /><path d="M12 22V12" /><path d="M21 7l-9 5-9-5" /></svg>}
            >
              {isDeploying 
                ? (deployStage === 'walrus' ? 'Storing…' : 'Registering…') 
                : (deployedBlobId ? 'Update Session' : 'Deploy to Walrus')}
            </Button>
          </motion.div>
        </header>

        <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-8">
          {/* Left Sidebar: Components */}
          <aside className="w-[320px] flex flex-col gap-6 overflow-hidden">
            <GlassCard className="flex-1 flex flex-col !p-8 !rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar border-white/40">
              <h3 className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-6">Components</h3>
              <div className="grid grid-cols-1 gap-3 mb-10">
                {FIELD_TYPES.map((type) => (
                  <motion.button
                    key={type.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addField(type)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-black/5 hover:border-[#cdb4ff] hover:bg-white transition-all group text-left shadow-sm hover:shadow-md"
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all group-hover:scale-110"
                      style={{ backgroundColor: `${type.color}40`, color: '#4a2e8c' }}
                    >
                      {type.icon}
                    </div>
                    <span className="font-jakarta font-bold text-[14px] text-gray-600 group-hover:text-black">{type.label}</span>
                    <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#4a2e8c]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </motion.button>
                ))}
              </div>
              {/* Activity Log */}
              {activityLog.length > 0 && (
                <div className="mt-auto pt-6 border-t border-black/5">
                  <h3 className="text-[9px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-4">Activity Log</h3>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {activityLog.map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-start gap-2"
                        >
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            log.type === 'seal' ? 'bg-amber-400' :
                            log.type === 'walrus' ? 'bg-blue-400' :
                            log.type === 'sui' ? 'bg-[#4a2e8c]' : 'bg-green-500'
                          }`} />
                          <span className="text-[11px] font-jakarta text-gray-500 leading-tight">
                            <span className="font-bold uppercase text-[9px] mr-1" style={{
                               color: log.type === 'seal' ? '#d97706' : 
                                      log.type === 'walrus' ? '#2563eb' : 
                                      log.type === 'sui' ? '#4a2e8c' : '#16a34a'
                            }}>[{log.type}]</span>
                            {log.msg}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </GlassCard>
          </aside>

          {/* Center Canvas */}
          <main className="flex-1 overflow-y-auto custom-scrollbar relative px-4">
            <div className="max-w-3xl mx-auto">
              {/* Form Description */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe your session goals (optional)…"
                  rows={2}
                  className="w-full bg-white/40 border border-black/5 rounded-[32px] px-8 py-6 font-jakarta font-medium text-gray-600 text-lg outline-none focus:border-[#cdb4ff] focus:bg-white/80 transition-all placeholder:text-gray-400 shadow-sm resize-none"
                />
              </motion.div>

              <AnimatePresence mode="popLayout">
                {fields.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-[500px] border-4 border-dashed border-[#cdb4ff]/30 rounded-[60px] flex flex-col items-center justify-center text-center p-16 bg-white/20 backdrop-blur-sm group hover:bg-white/30 transition-colors"
                  >
                    <div className="relative w-48 h-48 mb-10 animate-float">
                      <Image src="/form.png" alt="Mascot" fill className="object-contain" />
                    </div>
                    <h3 className="text-3xl font-outfit font-extrabold mb-4 text-[#4a2e8c] tracking-tight">Empty Canvas</h3>
                    <p className="font-jakarta font-bold text-gray-400 max-w-xs leading-relaxed">Your decentralized session starts here. Pick a component to begin building.</p>
                  </motion.div>
                ) : (
                  <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-6 pb-32">
                    {fields.map((field) => (
                      <Reorder.Item
                        key={field.id}
                        value={field}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className={`group relative glass-card !p-8 flex items-center gap-8 cursor-move transition-all !bg-white/90 !rounded-[40px] border-white shadow-xl ${selectedFieldId === field.id ? 'ring-4 ring-[#cdb4ff]/30 !border-[#cdb4ff]' : 'hover:scale-[1.01]'}`}
                        onClick={() => selectField(field)}
                      >
                        <div className="flex flex-col gap-1 text-gray-300 group-hover:text-[#4a2e8c] transition-colors">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 5h6M9 12h6M9 19h6" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-outfit font-bold text-xl text-black mb-2">{field.label}</div>
                          <div className="flex items-center gap-3">
                            <Badge color="purple">
                              {FIELD_TYPES.find((t) => t.id === field.type)?.label ?? field.type}
                            </Badge>
                            {field.required && (
                              <Badge color="red">Required</Badge>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                            className="w-12 h-12 rounded-full bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all flex items-center justify-center border border-red-100 shadow-sm"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </AnimatePresence>

              {/* Deploy error banner */}
              <AnimatePresence>
                {deployError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 p-6 bg-red-50 border border-red-200 rounded-[32px] text-red-600 font-jakarta text-sm font-bold flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 8v4M12 16h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" /></svg>
                    </div>
                    {deployError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success panel */}
              <AnimatePresence>
                {deployedBlobId && shareableLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-12 p-10 bg-[#4a2e8c] rounded-[56px] border border-white/20 shadow-[0_32px_64px_-16px_rgba(74,46,140,0.4)] relative overflow-hidden group"
                  >
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center shadow-xl">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a2e8c" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-2xl font-outfit font-extrabold text-white">Deployed Successfully</h4>
                          <p className="text-white/60 font-jakarta font-bold text-xs uppercase tracking-[0.2em]">Permanent on Walrus Protocol</p>
                        </div>
                      </div>

                      <div className="space-y-6 mb-10">
                        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
                          <div className="text-[10px] font-jakarta font-bold text-white/40 uppercase tracking-widest mb-2">Shareable Session Link</div>
                          <div className="font-outfit font-bold text-lg text-white break-all">{shareableLink}</div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          onClick={copyLink}
                          className="flex-1 !bg-white !text-black !py-4 font-extrabold"
                        >
                          {copied ? 'Copied ✓' : 'Copy Link'}
                        </Button>
                        <a
                          href={getExplorerUrl(deployedBlobId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-8 rounded-full bg-white/10 border border-white/10 text-white font-outfit font-bold flex items-center justify-center hover:bg-white/20 transition-all text-sm"
                        >
                          Explorer →
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* Right Sidebar: Properties */}
          <aside className="w-[380px] flex flex-col gap-6 overflow-hidden">
            <GlassCard className="flex-1 flex flex-col !p-10 !rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar border-white/40">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">Properties</h3>
                <AnimatePresence>
                  {selectedField && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-[#4a2e8c] px-3 py-1 rounded-full text-[9px] font-bold text-white border border-white/20 shadow-lg"
                    >
                      ACTIVE
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                {selectedField ? (
                  <motion.div
                    key={selectedField.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <button
                      onClick={() => setSelectedFieldId(null)}
                      className="flex items-center gap-2 text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest hover:opacity-70 transition-opacity"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      Back to Form Settings
                    </button>

                    <Input
                      label="Label Text"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      placeholder="Enter question label…"
                    />

                    {!['starrating', 'screenshot', 'video', 'confirmation', 'checkbox'].includes(selectedField.type) && (
                      <Input
                        label="Placeholder"
                        value={selectedField.placeholder ?? ''}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                        placeholder="Optional hint text…"
                      />
                    )}

                    {selectedField.type === 'dropdown' && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Options (one per line)</label>
                        <textarea
                          value={dropdownOptionsInput}
                          rows={5}
                          onChange={(e) => {
                            setDropdownOptionsInput(e.target.value);
                            const opts = e.target.value
                              .split('\n')
                              .map((o) => o.trim())
                              .filter(Boolean);
                            updateField(selectedField.id, { options: opts });
                          }}
                          className="w-full bg-gray-50/50 backdrop-blur-sm border border-black/5 rounded-[24px] px-6 py-5 font-jakarta font-bold text-sm text-black outline-none focus:border-[#cdb4ff] focus:bg-white shadow-inner transition-all resize-none"
                        />
                      </div>
                    )}

                    <div className="p-8 bg-[#4a2e8c]/5 rounded-[32px] border border-[#4a2e8c]/10 group/toggle">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest block mb-1">Mandatory</label>
                          <p className="text-[10px] text-gray-400 font-jakarta font-medium">User must answer</p>
                        </div>
                        <button
                          onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                          className={`w-14 h-7 rounded-full p-1 transition-all duration-500 ${selectedField.required ? 'bg-[#4a2e8c]' : 'bg-gray-200 shadow-inner'}`}
                        >
                          <motion.div 
                            animate={{ x: selectedField.required ? 28 : 0 }}
                            className="w-5 h-5 rounded-full bg-white shadow-xl" 
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button variant="danger" className="w-full !py-4 !rounded-[24px] !text-xs uppercase tracking-widest hover:!bg-red-500 hover:!text-white transition-all shadow-sm" onClick={() => deleteField(selectedField.id)}>
                        Remove Component
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col gap-8 p-4">
                    {/* Form Security — Seal Toggle */}
                    <div>
                      <h4 className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-6">Form Security</h4>
                      <div className="p-8 rounded-[32px] border border-amber-200/60 bg-amber-50/40">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              <label className="text-[11px] font-jakarta font-bold text-amber-700 uppercase tracking-widest">Seal Encryption</label>
                            </div>
                            <p className="text-[10px] text-amber-600/70 font-jakarta">
                              {sealEnabled ? 'ON — Submissions are threshold-encrypted' : 'OFF — Submissions are stored in plaintext'}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleSeal(!sealEnabled)}
                            className={`w-16 h-8 rounded-full p-1 transition-all duration-500 ${
                              sealEnabled ? 'bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-gray-200 shadow-inner'
                            }`}
                          >
                            <motion.div
                              animate={{ x: sealEnabled ? 32 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                              {sealEnabled && (
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                              )}
                            </motion.div>
                          </button>
                        </div>

                        <AnimatePresence>
                          {sealEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 border-t border-amber-200/60 mt-4">
                                <label className="text-[10px] font-jakarta font-bold text-amber-700 uppercase tracking-widest block mb-3">Team Members & Authorized Decryptors</label>
                                <p className="text-[10px] text-amber-600/60 font-jakarta mb-3">One wallet address per line. These wallets will form your team and can read encrypted submissions.</p>
                                <textarea
                                  value={sealWalletInput}
                                  onChange={(e) => saveSealWallets(e.target.value)}
                                  rows={3}
                                  placeholder={"0xabc123...\n0xdef456..."}
                                  className="w-full bg-white/60 border border-amber-200 rounded-[20px] px-5 py-4 font-mono text-xs text-gray-700 outline-none focus:border-amber-400 transition-all resize-none placeholder:text-gray-300 shadow-inner"
                                />
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span className="text-[9px] font-jakarta text-amber-600 font-bold uppercase tracking-widest">
                                    {sealWalletInput.split('\n').filter(w => w.trim()).length} wallet(s) authorized
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Incentives — Reward Toggle */}
                    <div>
                      <h4 className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-6">Incentives</h4>
                      <div className="p-8 rounded-[32px] border border-green-200/60 bg-green-50/40">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                              <label className="text-[11px] font-jakarta font-bold text-green-700 uppercase tracking-widest">SUI Rewards</label>
                            </div>
                            <p className="text-[10px] text-green-600/70 font-jakarta">
                              {incentivesEnabled ? 'ON — Respondents get paid' : 'OFF — No rewards'}
                            </p>
                          </div>
                          <button
                            onClick={() => setIncentivesEnabled(!incentivesEnabled)}
                            className={`w-16 h-8 rounded-full p-1 transition-all duration-500 ${
                              incentivesEnabled ? 'bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.5)]' : 'bg-gray-200 shadow-inner'
                            }`}
                          >
                            <motion.div
                              animate={{ x: incentivesEnabled ? 32 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                              {incentivesEnabled && (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                            </motion.div>
                          </button>
                        </div>

                        <AnimatePresence>
                          {incentivesEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 border-t border-green-200/60 mt-4 space-y-4">
                                <div>
                                  <label className="text-[10px] font-jakarta font-bold text-green-700 uppercase tracking-widest block mb-2">Reward Per Response (SUI)</label>
                                  <input
                                    type="number"
                                    value={rewardPerResponse}
                                    onChange={(e) => setRewardPerResponse(e.target.value)}
                                    placeholder="0.1"
                                    className="w-full bg-white/60 border border-green-200 rounded-[16px] px-4 py-3 font-jakarta font-bold text-sm text-gray-700 outline-none focus:border-green-400 transition-all shadow-inner"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-jakarta font-bold text-green-700 uppercase tracking-widest block mb-2">Max Rewarded Responses</label>
                                  <input
                                    type="number"
                                    value={maxResponses}
                                    onChange={(e) => setMaxResponses(e.target.value)}
                                    placeholder="100"
                                    className="w-full bg-white/60 border border-green-200 rounded-[16px] px-4 py-3 font-jakarta font-bold text-sm text-gray-700 outline-none focus:border-green-400 transition-all shadow-inner"
                                  />
                                </div>
                                <div className="p-3 bg-green-100/50 rounded-[12px] text-[10px] font-jakarta text-green-700 font-bold">
                                  Total Pool: {(parseFloat(rewardPerResponse) * parseFloat(maxResponses)).toFixed(2)} SUI
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Misc hint */}
                    <div className="text-center mt-auto">
                      <p className="text-[10px] font-jakarta text-gray-400 leading-relaxed">Select any component on the canvas to configure its properties.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </GlassCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

