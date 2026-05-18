"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Badge, Modal } from '@/components/ui';
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
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { getFormByBlobId, getTeamForForm, updateSubmissionMetaTx, getFormsForTeamMember, getFormsByIds, addDecryptorTx, getDecryptorsMapping, addTeamMemberTx } from '@/lib/suiActions';
import DOMPurify from 'dompurify';
import { analyzeSubmissions, AIAnalysisResult } from '@/lib/ai';
import { WALRUS_AGGREGATOR } from '@/lib/contracts';

type Submission = FormSubmission & AdminMeta & { _blobId?: string; _formTitle?: string; _decrypted?: boolean; _sealError?: string };

const STATUS_OPTIONS = ['New', 'In Review', 'Actioned', 'Archived'] as const;

function AnswerItem({ label, value, fieldType }: { label: string, value: any, fieldType?: string }) {
  const [error, setError] = useState(false);
  
  const isBlobId = typeof value === 'string' && /^[a-zA-Z0-9_-]{43,44}$/.test(value);
  
  return (
    <div className="p-6 rounded-[32px] bg-gray-50/50 border border-black/5">
      <div className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</div>
      <div className="font-jakarta font-bold text-[15px] text-gray-800 break-words whitespace-pre-wrap">
        {fieldType === 'video' || (isBlobId && !error) ? (
          <video 
            src={`${WALRUS_AGGREGATOR}/v1/blobs/${value}`} 
            controls 
            className="w-full max-h-[300px] rounded-2xl mt-2" 
            onError={() => setError(true)}
          />
        ) : fieldType === 'screenshot' || (isBlobId && error) ? (
          <img 
            src={`${WALRUS_AGGREGATOR}/v1/blobs/${value}`} 
            alt={label} 
            className="w-full max-h-[300px] object-contain rounded-2xl mt-2" 
            onError={() => setError(true)}
          />
        ) : !(typeof value === 'string' && value.startsWith('<')) ? (
          typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '—')
        ) : (
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value as string) }} />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [responses, setResponses] = useState<Submission[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [forms, setForms] = useState<(FormDefinition & { _blobId: string })[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | 'all'>('all');
  const [selectedFormObjectId, setSelectedFormObjectId] = useState<string | null>(null);
  const [selectedTeamObjectId, setSelectedTeamObjectId] = useState<string | null>(null);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (selectedFormId === 'all') {
      setSelectedFormObjectId(null);
      setSelectedTeamObjectId(null);
      return;
    }
    
    getFormByBlobId(selectedFormId).then((suiForm) => {
      if (suiForm?.objectId) {
        setSelectedFormObjectId(suiForm.objectId);
        getTeamForForm(suiForm.objectId).then(setSelectedTeamObjectId);
      }
    });
  }, [selectedFormId]);

  const [loadingResponses, setLoadingResponses] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<Submission | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [rankInput, setRankInput] = useState(0);
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [onPromptConfirm, setOnPromptConfirm] = useState<(val: string) => void>(() => (val: string) => {});

  const showPrompt = (title: string, onConfirm: (val: string) => void) => {
    setPromptTitle(title);
    setPromptValue('');
    setOnPromptConfirm(() => onConfirm);
    setPromptOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const account = useCurrentAccount();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'sui' | 'walrus' | 'seal' | 'done'>('idle');
  const [syncLogs, setSyncLogs] = useState<{msg: string, type: 'sui' | 'walrus' | 'seal'}[]>([]);

  const addSyncLog = (msg: string, type: 'sui' | 'walrus' | 'seal') => {
    setSyncLogs(prev => [...prev, { msg, type }].slice(-3));
  };

  // Load all submissions from all forms in registry
  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoadingResponses(true);
      setSyncStatus('sui');
      setSyncLogs([]);
      
      try {
        addSyncLog("Querying Sui for decentralized registry...", "sui");
        const registry = await getFormRegistry(account?.address);
        let formIds = Object.keys(registry);
        const teamMembersMapping: Record<string, string[]> = {};
        
        if (account?.address) {
          addSyncLog("Checking for team invitations...", "sui");
          const teamFormIds = await getFormsForTeamMember(account.address);
          if (teamFormIds.length > 0) {
            addSyncLog(`Found ${teamFormIds.length} team invitations.`, "sui");
            const teamForms = await getFormsByIds(teamFormIds);
            const teamFormBlobIds = teamForms.map(f => f.formBlobId).filter(Boolean) as string[];
            
            teamForms.forEach(f => {
              if (f.formBlobId) {
                teamMembersMapping[f.formBlobId] = f.teamMembers;
              }
            });
            
            formIds = Array.from(new Set([...formIds, ...teamFormBlobIds]));
          }
        }
        
        addSyncLog(`Found ${formIds.length} total forms.`, "sui");

        if (formIds.length === 0) {
          if (active) setResponses([]);
          setSyncStatus('done');
          return;
        }

        setSyncStatus('walrus');
        addSyncLog("Fetching form definitions from Walrus...", "walrus");
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

        addSyncLog("Loading submission indices from Walrus...", "walrus");
        setSyncStatus('seal');
        
        addSyncLog("Fetching updated decryptors from Sui...", "sui");
        const decryptorsMapping = await getDecryptorsMapping();
        
        const allSubsPerForm = await Promise.allSettled(
          formIds.map((fid) => getSubmissionsForForm(fid).then(async (subs) => {
            const form = formByBlobId[fid];
            const allowed = teamMembersMapping[fid] ?? decryptorsMapping[fid] ?? form?.settings.allowedDecryptors ?? [];
            if (subs.length > 0) {
              addSyncLog(`Decrypting ${subs.length} responses for ${form?.title || fid}...`, "seal");
            }
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

        const flat: Submission[] = (allSubsPerForm
          .filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<Submission[]>[])
          .flatMap((r) => r.value)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        if (active) setResponses(flat);
        setSyncStatus('done');
      } catch (err) {
        console.error('Dashboard load error:', err);
        setSyncStatus('idle');
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
    
    if (selectedFormObjectId) {
      const tx = updateSubmissionMetaTx(
        selectedFormObjectId,
        selectedResponse._blobId!,
        selectedResponse.status || 'New',
        noteInput,
        rankInput
      );
      signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          setResponses((prev) =>
            prev.map((r) => r._blobId === selectedResponse._blobId ? { ...r, adminNote: noteInput } : r)
          );
          setSelectedResponse((prev) => prev ? { ...prev, adminNote: noteInput } : prev);
          setSavedNote(true);
          setTimeout(() => setSavedNote(false), 2000);
        },
        onError: (e) => showModal('Error', 'Failed to save note: ' + e.message),
        onSettled: () => setSavingNote(false),
      });
    } else {
      showModal('Notice', 'Form ID not loaded yet. Please wait or refresh.');
      setSavingNote(false);
    }
  };

  const handleStatusChange = (status: string) => {
    if (!selectedResponse?._blobId) return;
    const s = status as AdminMeta['status'];
    
    if (selectedFormObjectId) {
      const tx = updateSubmissionMetaTx(
        selectedFormObjectId,
        selectedResponse._blobId!,
        status,
        selectedResponse.adminNote || '',
        rankInput
      );
      signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          setResponses((prev) =>
            prev.map((r) => r._blobId === selectedResponse._blobId ? { ...r, status: s } : r)
          );
          setSelectedResponse((prev) => prev ? { ...prev, status: s } : prev);
        },
        onError: (e) => showModal('Error', 'Failed to update status: ' + e.message),
      });
    } else {
      showModal('Notice', 'Form ID not loaded yet. Please wait or refresh.');
    }
  };

  const handleRankChange = (rank: number) => {
    if (!selectedResponse?._blobId) return;
    setRankInput(rank);
    
    if (selectedFormObjectId) {
      const tx = updateSubmissionMetaTx(
        selectedFormObjectId,
        selectedResponse._blobId!,
        selectedResponse.status || 'New',
        noteInput,
        rank
      );
      signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          setResponses((prev) =>
            prev.map((r) => r._blobId === selectedResponse._blobId ? { ...r, rank: rank } : r)
          );
          setSelectedResponse((prev) => prev ? { ...prev, rank: rank } : prev);
        },
        onError: (e) => showModal('Error', 'Failed to save rank: ' + e.message),
      });
    } else {
      showModal('Notice', 'Form ID not loaded yet. Please wait or refresh.');
    }
  };

  const handleArchive = () => handleStatusChange('Archived');

  const handleImportForm = () => {
    showPrompt('Enter Form Blob ID:', async (blobId) => {
      if (!blobId) return;
      
      setLoadingResponses(true);
      try {
        const form = await loadFormDefinition(blobId);
        if (form) {
          setForms(prev => {
            if (prev.some(f => f._blobId === blobId)) {
              showModal('Notice', 'Form already in list!');
              return prev;
            }
            return [...prev, { ...form, _blobId: blobId }];
          });
          
          const subs = await getSubmissionsForForm(blobId);
          setResponses(prev => [...prev, ...subs.map(s => ({ ...s, formBlobId: blobId }))]);
          
          showModal('Success', 'Form imported successfully!');
        }
      } catch (e: any) {
        showModal('Error', 'Failed to load form: ' + e.message);
      } finally {
        setLoadingResponses(false);
      }
    });
  };

  const handleExportCSV = () => {
    const formToExport = forms.find((f) => f._blobId === selectedFormId) ?? forms[0];
    if (!formToExport) return;
    const subsForForm = responses.filter((r) => r.formBlobId === formToExport._blobId);
    exportSubmissionsToCSV(formToExport, subsForForm);
  };

  const handleAddTeamMember = () => {
    showPrompt('Enter wallet address to add as admin:', async (address) => {
      if (!address) return;
      
      if (!selectedFormObjectId) {
        showModal('Notice', 'Form ID not loaded yet. Please wait or refresh.');
        return;
      }
      
      try {
        let tx;
        if (selectedTeamObjectId) {
          tx = addDecryptorTx(selectedFormObjectId, selectedTeamObjectId, address);
        } else {
          tx = addTeamMemberTx(selectedFormObjectId, address);
        }
        signAndExecute({ transaction: tx }, {
          onSuccess: (result) => {
            showModal('Success', 'Team member added successfully!');
            console.log(result);
          },
          onError: (error) => {
            showModal('Error', 'Error adding team member: ' + error.message);
            console.log(error);
          }
        });
      } catch (e) {
        showModal('Error', 'Error: ' + (e instanceof Error ? e.message : String(e)));
      }
    });
  };

  const runAIAnalysis = async () => {
    const formToAnalyze = forms.find((f) => f._blobId === selectedFormId) ?? forms[0];
    if (!formToAnalyze) return;
    const subsForForm = responses.filter((r) => r.formBlobId === formToAnalyze._blobId);
    if (subsForForm.length === 0) {
      showModal('Notice', 'No submissions to analyze for this form.');
      return;
    }
    
    setAiLoading(true);
    try {
      const submissionsToAnalyze = subsForForm.map(s => s.answers);
      const model = localStorage.getItem('worm_default_model') ?? 'deepseek/deepseek-v4-flash:free';
      const result = await analyzeSubmissions(formToAnalyze.title, submissionsToAnalyze, model);
      setAiResult(result);
    } catch (e) {
      console.error(e);
      showModal('Error', e instanceof Error ? e.message : 'AI Analysis failed');
    } finally {
      setAiLoading(false);
    }
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
          {/* Header Area with Sync Status */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h1 className="text-6xl font-syne font-extrabold text-black mb-4 tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-500 font-jakarta font-bold text-sm uppercase tracking-widest">Managing your decentralized sessions</p>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-black/5 shadow-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'done' ? 'bg-green-500' : 'bg-[#4a2e8c] animate-pulse'}`} />
                  <span className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">
                    {syncStatus === 'idle' ? 'Idle' :
                     syncStatus === 'sui' ? 'Sui Sync' :
                     syncStatus === 'walrus' ? 'Walrus Sync' :
                     syncStatus === 'seal' ? 'Seal Decrypting' : 'Verified'}
                  </span>
                </div>
              </div>
              {syncLogs.length > 0 && syncStatus !== 'done' && (
                <div className="flex flex-col gap-1 mt-4">
                  {syncLogs.map((log, i) => (
                    <span key={i} className="text-[10px] font-jakarta text-gray-400 italic">
                      <span className="font-bold mr-1" style={{ color: log.type === 'sui' ? '#4a2e8c' : log.type === 'walrus' ? '#2563eb' : '#d97706' }}>[{log.type}]</span> {log.msg}
                    </span>
                  ))}
                </div>
              )}
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
              {selectedFormId !== 'all' && (
                <Button variant="ghost" onClick={handleAddTeamMember} className="shadow-sm border-black/5 !px-8">
                  Add Team
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={runAIAnalysis} 
                className="shadow-sm border-black/5 !px-8 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200/50 shadow-[0_0_15px_rgba(124,58,237,0.1)] transition-all duration-300"
                disabled={aiLoading}
              >
                {aiLoading && (
                  <div className="w-4 h-4 border-2 border-[#4a2e8c] border-t-transparent rounded-full animate-spin" />
                )}
                <span className="font-outfit font-bold bg-gradient-to-r from-[#4a2e8c] to-[#7c3aed] bg-clip-text text-transparent">AI Insights</span>
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
              {aiResult && (
                <GlassCard className="!p-10 mb-8 !bg-purple-50/50 !border-purple-200/50 !rounded-[32px] shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#4a2e8c] rounded-full flex items-center justify-center text-white font-bold text-xs">
                        AI
                      </div>
                      <div>
                        <h3 className="text-xl font-outfit font-bold text-black">AI Insights</h3>
                        <p className="text-[10px] font-jakarta text-gray-400 uppercase tracking-widest font-bold">OpenRouter Powered</p>
                      </div>
                    </div>
                    <button onClick={() => setAiResult(null)} className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="font-jakarta text-sm text-gray-700 leading-relaxed">{aiResult.rawSummary}</p>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest mb-3">Key Consensus Points</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.consensusPoints.map((point, i) => (
                          <span key={i} className="px-4 py-2 bg-white/80 rounded-full border border-purple-100 text-xs font-jakarta font-bold text-gray-700 shadow-sm">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest mb-3">Suggested Actions</h4>
                      <ul className="space-y-2">
                        {aiResult.suggestedActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-3 text-xs font-jakarta text-gray-600">
                            <span className="text-[#4a2e8c] font-bold">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              )}
              <GlassCard className="!p-0 overflow-hidden !bg-white/80 !rounded-[48px] border-white shadow-2xl relative h-full">
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

                {selectedFormId !== 'all' && (
                  <div className="px-6 py-4 bg-[#4a2e8c]/5 border-b border-black/[0.03] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-jakarta text-gray-500">
                      <span className="font-bold">Form Link:</span>
                      <span className="font-mono text-[#4a2e8c]">{`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${selectedFormId}`}</span>
                    </div>
                    <Button 
                      variant="ghost-purple" 
                      className="!py-2 !px-2 rounded-full flex items-center justify-center"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/form/${selectedFormId}`);
                          showModal('Success', 'Link copied to clipboard!');
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    </Button>
                  </div>
                )}

                {loadingResponses ? (
                  <div className="p-24 flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-[#cdb4ff]/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-[#4a2e8c] animate-spin" />
                    </div>
                    <p className="font-jakarta font-bold text-[11px] text-[#4a2e8c] uppercase tracking-[0.2em]">Syncing decentralized data…</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/[0.02] bg-black/[0.01]">
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-10">Response ID</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Session Title</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Status</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rank</th>
                          <th className="p-6 font-jakarta text-[10px] text-gray-400 font-bold uppercase tracking-widest text-right pr-10">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.01]">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                              </div>
                              <h4 className="font-outfit font-bold text-lg mb-1 text-gray-400">Quiet in here…</h4>
                              <p className="font-jakarta text-gray-400 text-xs max-w-xs mx-auto">Deploy a form and share the link to start collecting decentralized feedback.</p>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((resp, i) => (
                          <motion.tr
                            key={resp._blobId ?? resp.submissionId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => {
                              setSelectedResponse(resp);
                              setNoteInput(resp.adminNote ?? '');
                              setRankInput(resp.rank ?? 0);
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
                            <td className="p-6">
                              <span className="font-jakarta font-bold text-[13px] text-gray-600">
                                {resp.rank ? `⭐️ ${resp.rank}` : '-'}
                              </span>
                            </td>
                            <td className="p-6 text-right pr-10">
                              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center ml-auto group-hover:bg-[#4a2e8c] group-hover:text-white transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              </div>
                            </td>
                          </motion.tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <GlassCard className="!p-10 !bg-white/80 !rounded-[48px] border-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-outfit font-bold text-black">Active Forms</h3>
                    <p className="text-[10px] font-jakarta text-gray-400 uppercase tracking-widest font-bold mt-1">Your deployed sessions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={handleImportForm}
                      className="!py-1.5 !px-3 text-xs font-bold border-black/5 hover:bg-black/5"
                    >
                      Import
                    </Button>
                    <div className={`w-2 h-2 rounded-full ${forms.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  </div>
                </div>
                <div className="space-y-4">
                  {forms.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                      </div>
                      <p className="font-jakarta text-xs text-gray-400 font-bold">No forms deployed yet</p>
                    </div>
                  ) : (
                    forms.map((form) => {
                      const subCount = responses.filter(r => r.formBlobId === form._blobId).length;
                      return (
                        <motion.button
                          key={form._blobId}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedFormId(form._blobId)}
                          className={`w-full text-left p-5 rounded-[24px] border transition-all group ${selectedFormId === form._blobId ? 'bg-[#4a2e8c]/5 border-[#4a2e8c]/20' : 'bg-gray-50/50 border-black/5 hover:border-[#cdb4ff]'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-jakarta font-bold text-[13px] text-black truncate">{form.title}</div>
                              <div className="text-[10px] font-jakarta text-gray-400 mt-1 uppercase tracking-wider font-bold">{subCount} response{subCount !== 1 ? 's' : ''}</div>
                            </div>
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedFormId === form._blobId ? 'bg-[#4a2e8c] text-white' : 'bg-black/5 group-hover:bg-[#4a2e8c] group-hover:text-white'}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
                {forms.length > 0 && (
                  <button
                    onClick={() => setSelectedFormId('all')}
                    className="mt-6 w-full text-center text-[10px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest hover:opacity-70 transition-opacity"
                  >
                    View All Sessions →
                  </button>
                )}
              </GlassCard>

              <GlassCard className="!p-10 !bg-white/80 !rounded-[48px] border-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-outfit font-bold">Live Activity</h3>
                  <div className={`w-2 h-2 rounded-full ${responses.length > 0 ? 'bg-green-500' : 'bg-gray-300'} animate-pulse`} />
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
                      {Object.entries(selectedResponse.answers ?? {}).map(([k, v]) => {
                        const currentForm = forms.find(f => f._blobId === selectedFormId);
                        const field = currentForm?.fields.find((f: any) => f.id === k);
                        
                        return (
                          <AnswerItem 
                            key={k}
                            label={field?.label || k}
                            value={v}
                            fieldType={field?.type}
                          />
                        );
                      })}
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
                            href={`${WALRUS_AGGREGATOR}/v1/blobs/${id}`} 
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

                    <div className="space-y-4">
                      <label className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-[0.2em] block">Rank / Priority</label>
                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRankChange(r)}
                            className={`w-10 h-10 rounded-full border font-jakarta font-bold text-[14px] transition-all ${
                              rankInput === r
                                ? 'bg-[#4a2e8c] text-white border-[#4a2e8c] shadow-lg scale-105'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-[#cdb4ff] hover:text-[#4a2e8c]'
                            }`}
                          >
                            {r}
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
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        {modalMessage}
      </Modal>

      <Modal isOpen={promptOpen} onClose={() => setPromptOpen(false)} title={promptTitle}>
        <div className="space-y-4">
          <input 
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            className="w-full bg-gray-50/50 border border-black/5 rounded-2xl px-4 py-3 font-jakarta text-sm outline-none focus:border-[#cdb4ff] text-black"
            placeholder="Type here..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPromptOpen(false)}>Cancel</Button>
            <Button variant="purple" onClick={() => { onPromptConfirm(promptValue); setPromptOpen(false); }}>OK</Button>
          </div>
        </div>
      </Modal>
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
