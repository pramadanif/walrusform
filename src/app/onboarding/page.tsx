"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import { saveFormDefinition, FormDefinition, FormField, getLocalFormRegistry } from '@/lib/formStorage';
import { getSubmissionsForForm } from '@/lib/submissionStorage';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftFields, setDraftFields] = useState<FormField[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [formBlobId, setFormBlobId] = useState<string | null>(null);
  const [stats, setStats] = useState({ responses: 0, forms: 0 });
  const router = useRouter();

  const nextStep = () => setStep(s => Math.min(s + 1, 4));

  useEffect(() => {
    const loadStats = async () => {
      const registry = getLocalFormRegistry();
      const formIds = Object.keys(registry);
      const counts = await Promise.allSettled(
        formIds.map((id) => getSubmissionsForForm(id).then((subs) => subs.length))
      );
      const responses = counts
        .filter((r): r is PromiseFulfilledResult<number> => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value, 0);
      setStats({ responses, forms: formIds.length });
    };
    loadStats();
  }, [formBlobId]);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center relative">
      <AppBackground />
      
      {/* Top Nav */}
      <div className="w-full max-w-[1200px] flex justify-between items-center mb-16 relative z-10">
        <h2 className="text-[#4a2e8c] font-outfit font-bold text-[13px] tracking-[0.3em] uppercase">
          WALRUS SESSIONS
        </h2>
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-black font-jakarta text-[13px] transition-colors font-medium">
          Skip
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[600px] mb-24 relative z-10">
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                s < step ? 'bg-[#4a2e8c]' : 
                s === step ? 'bg-[#4a2e8c] ring-4 ring-[#cdb4ff]/40' : 
                'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
        <div className="h-[2px] w-full bg-gray-100 relative overflow-hidden rounded-full">
          <motion.div 
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 3) * 100}%` }}
            className="absolute h-full bg-[#4a2e8c] shadow-[0_0_10px_rgba(74,46,140,0.2)]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-[800px] relative z-10 text-black">
        <AnimatePresence mode="wait">
          {step === 1 && <StepWelcome key="1" onNext={nextStep} />}
          {step === 2 && (
            <StepCreate
              key="2"
              onNext={nextStep}
              title={draftTitle}
              setTitle={setDraftTitle}
              fields={draftFields}
              setFields={setDraftFields}
            />
          )}
          {step === 3 && (
            <StepShare
              key="3"
              onNext={nextStep}
              title={draftTitle}
              fields={draftFields}
              deploying={deploying}
              setDeploying={setDeploying}
              deployError={deployError}
              setDeployError={setDeployError}
              shareLink={shareLink}
              setShareLink={setShareLink}
              formBlobId={formBlobId}
              setFormBlobId={setFormBlobId}
            />
          )}
          {step === 4 && (
            <StepFinal
              key="4"
              onNext={() => router.push('/dashboard')}
              responses={stats.responses}
              forms={stats.forms}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <h1 className="text-5xl md:text-6xl font-outfit font-bold mb-6 max-w-2xl mx-auto leading-tight">
        Build forms that <span className="text-[#4a2e8c]">live forever.</span>
      </h1>
      <p className="text-gray-600 font-jakarta text-lg mb-16 max-w-xl mx-auto">
        Walrus Sessions stores every response permanently onchain using the Walrus Protocol.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
        <IconCard icon={<FormIcon />} label="Create Form" />
        <IconCard icon={<WalrusIcon />} label="Walrus Node" />
        <IconCard icon={<DashboardIcon />} label="Live Insights" />
      </div>

      <Button onClick={onNext} className="mx-auto !px-12 !py-4 shadow-xl">
        Get Started →
      </Button>
    </motion.div>
  );
}

function StepCreate({
  onNext,
  title,
  setTitle,
  fields,
  setFields,
}: {
  onNext: () => void;
  title: string;
  setTitle: (val: string) => void;
  fields: FormField[];
  setFields: (val: FormField[]) => void;
}) {
  const addField = (type: 'text' | 'starrating' | 'dropdown' | 'checkbox') => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: type === 'starrating' ? 'Rating' : type.charAt(0).toUpperCase() + type.slice(1),
      required: false,
      placeholder: type === 'text' ? 'Type here...' : undefined,
      options: type === 'dropdown' ? ['Option A', 'Option B'] : undefined,
    };
    setFields([...fields, newField]);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-[500px] mx-auto text-center"
    >
      <h1 className="text-4xl font-outfit font-bold mb-4">Name your first form.</h1>
      <input 
        type="text" 
        placeholder="e.g. Bug Report, Community Survey..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl px-6 py-4 font-jakarta text-black mb-10 outline-none focus:border-[#cdb4ff] focus:ring-4 focus:ring-[#cdb4ff]/10 transition-all shadow-sm"
      />

      <div className="flex justify-center gap-3 mb-12">
        {['Text', 'Rating', 'Dropdown', 'Checkbox'].map((type) => (
          <button 
            key={type}
            onClick={() => {
              if (type === 'Text') addField('text');
              if (type === 'Rating') addField('starrating');
              if (type === 'Dropdown') addField('dropdown');
              if (type === 'Checkbox') addField('checkbox');
            }}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 font-jakarta text-xs hover:border-[#cdb4ff] hover:bg-white transition-all font-medium"
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-12">
        <AnimatePresence>
          {fields.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card !p-4 !rounded-xl flex items-center justify-between text-left !bg-white/90"
            >
              <span className="font-outfit font-bold text-sm">{f.label} Field</span>
              <div className="w-4 h-4 rounded-full border-2 border-[#cdb4ff]"></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button onClick={onNext} className="mx-auto" disabled={!title.trim() || fields.length === 0}>
        Continue →
      </Button>
    </motion.div>
  );
}

function StepShare({
  onNext,
  title,
  fields,
  deploying,
  setDeploying,
  deployError,
  setDeployError,
  shareLink,
  setShareLink,
  formBlobId,
  setFormBlobId,
}: {
  onNext: () => void;
  title: string;
  fields: FormField[];
  deploying: boolean;
  setDeploying: (val: boolean) => void;
  deployError: string | null;
  setDeployError: (val: string | null) => void;
  shareLink: string | null;
  setShareLink: (val: string | null) => void;
  formBlobId: string | null;
  setFormBlobId: (val: string | null) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const deploy = async () => {
      if (formBlobId || deploying) return;
      if (!title.trim() || fields.length === 0) {
        setDeployError('Add a title and at least one field to deploy.');
        return;
      }
      setDeploying(true);
      setDeployError(null);
      try {
        const formDef: FormDefinition = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: 'Created via onboarding',
          fields,
          createdAt: new Date().toISOString(),
          settings: { requireWallet: false, encryptWithSeal: false },
        };
        const blobId = await saveFormDefinition(formDef);
        setFormBlobId(blobId);
        setShareLink(`${window.location.origin}/form/${blobId}`);
      } catch (e: unknown) {
        setDeployError(e instanceof Error ? e.message : 'Deployment failed');
      } finally {
        setDeploying(false);
      }
    };
    deploy();
  }, [formBlobId, deploying, title, fields, setDeploying, setDeployError, setFormBlobId, setShareLink]);

  const tweetUrl = shareLink
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent('New WalrusForm session:')}%20${encodeURIComponent(shareLink)}`
    : '#';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-[500px] mx-auto text-center"
    >
      <h1 className="text-4xl font-outfit font-bold mb-4">Your form is live.</h1>
      
      <div className="glass-card !bg-white/90 !p-4 flex items-center justify-between mb-6 group !rounded-2xl">
        <code className="text-[#4a2e8c] font-jakarta font-bold text-sm break-all">{shareLink ?? 'Deploying...'}</code>
        <button
          onClick={() => {
            if (!shareLink) return;
            navigator.clipboard.writeText(shareLink).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="text-gray-400 hover:text-[#4a2e8c] transition-colors"
        >
          {copied ? "✓" : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
        </button>
      </div>

      {deployError && (
        <div className="mb-6 text-red-500 font-jakarta font-bold text-xs uppercase tracking-widest">
          {deployError}
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full mb-12 !py-4 shadow-sm"
        disabled={!shareLink}
        onClick={() => {
          if (shareLink) window.open(tweetUrl, '_blank');
        }}
      >
        Share on X with #Walrus
      </Button>

      <Button onClick={onNext} className="mx-auto" disabled={!shareLink}>
        Go to Dashboard →
      </Button>

      {copied && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 glass-card !px-6 !py-3 !border-[#cdb4ff]/50 !bg-[#4a2e8c] !text-white"
        >
          <span className="font-outfit font-bold text-sm">Copied ✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function StepFinal({ onNext, responses, forms }: { onNext: () => void; responses: number; forms: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-[500px] mx-auto text-center"
    >
      <div className="mb-8 flex justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100" className="text-[#4a2e8c]">
          <motion.circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
          <motion.path d="M30 50L45 65L70 35" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.8 }} />
        </svg>
      </div>
      <h1 className="text-4xl font-outfit font-bold mb-12">You&apos;re ready.</h1>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="glass-card !p-6 !bg-white/80">
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Responses</div>
          <div className="text-3xl font-outfit font-bold">{responses}</div>
        </div>
        <div className="glass-card !p-6 !bg-white/80">
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Active</div>
          <div className="text-3xl font-outfit font-bold">{forms}</div>
        </div>
      </div>
      <Button onClick={onNext} className="mx-auto">
        Open Dashboard →
      </Button>
    </motion.div>
  );
}

function IconCard({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="glass-card !p-8 flex flex-col items-center gap-4 relative z-10 !bg-white/90">
      <div className="text-[#4a2e8c]">{icon}</div>
      <span className="text-black font-outfit font-bold text-sm">{label}</span>
    </div>
  );
}

// Icons
const FormIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21H3V3h18v18h-9z"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>;
const WalrusIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>;
const DashboardIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18M7 17v-4M11 17v-8M15 17v-12M19 17v-6"/></svg>;
