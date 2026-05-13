"use client";

import React, { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import AppBackground from '@/components/AppBackground';

const MOCK_FIELDS = [
  { id: '1', type: 'text', label: 'Bug Title', required: true, placeholder: 'Brief description of the issue' },
  { id: '2', type: 'text', label: 'Steps to Reproduce', required: true, placeholder: '1. Open app\n2. Click...' },
  { id: '3', type: 'rating', label: 'Severity', required: true },
  { id: '4', type: 'screenshot', label: 'Screenshot', required: false },
  { id: '5', type: 'url', label: 'Reproduction Link', required: false, placeholder: 'https://...' },
  { id: '6', type: 'confirm', label: 'I agree to the privacy policy', required: true },
];

export default function PublicFormPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 3000);
  };

  const progress = (Object.keys(formValues).length / MOCK_FIELDS.filter(f => f.required).length) * 100;

  if (submitted) return <SuccessState />;

  return (
    <div className="min-h-screen py-20 px-4 relative text-black">
      <AppBackground />
      <div className="max-w-[680px] mx-auto relative z-10">
        <header className="mb-12 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-outfit font-bold mb-3 text-black">Bug Report</h1>
              <p className="text-gray-500 font-jakarta font-medium text-sm">Help us improve the network by reporting technical issues.</p>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-black/5 shadow-sm">
              <span className="font-jakarta font-bold text-[9px] text-gray-400 uppercase tracking-widest">Powered by Walrus Sessions</span>
            </div>
          </div>
          
          <div className="h-[3px] w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className="h-full bg-[#4a2e8c] shadow-[0_0_10px_rgba(74,46,140,0.2)]" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {MOCK_FIELDS.map((field) => (
            <GlassCard key={field.id} className="!p-8 !bg-white/95 !rounded-3xl border-black/5">
              <div className="flex items-center gap-2 mb-4">
                <label className="font-outfit font-bold text-xs text-gray-800 uppercase tracking-[0.1em]">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
              </div>

              {field.type === 'text' && (
                <textarea placeholder={field.placeholder} rows={field.label.includes('Steps') ? 4 : 1} required={field.required} onChange={(e) => setFormValues({...formValues, [field.id]: e.target.value})} className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 font-jakarta font-medium text-black outline-none focus:border-[#cdb4ff] focus:ring-4 focus:ring-[#cdb4ff]/10 transition-all placeholder:text-gray-300 resize-none shadow-inner" />
              )}

              {field.type === 'rating' && (
                <RatingInput onChange={(val) => setFormValues({...formValues, [field.id]: val})} />
              )}

              {field.type === 'screenshot' && (
                <div className="h-32 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-gray-50 hover:border-[#cdb4ff] transition-all cursor-pointer group">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 group-hover:text-[#4a2e8c] transition-colors"><path d="M12 5v14M5 12h14"/></svg>
                  <span className="font-jakarta font-bold text-xs text-gray-400 group-hover:text-[#4a2e8c]">Upload Screenshot</span>
                </div>
              )}

              {field.type === 'url' && (
                <input type="url" placeholder={field.placeholder} required={field.required} onChange={(e) => setFormValues({...formValues, [field.id]: e.target.value})} className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 font-jakarta font-medium text-black outline-none focus:border-[#cdb4ff] focus:ring-4 focus:ring-[#cdb4ff]/10 transition-all shadow-inner" />
              )}

              {field.type === 'confirm' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" required={field.required} onChange={(e) => setFormValues({...formValues, [field.id]: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-200 bg-gray-50 text-[#4a2e8c] focus:ring-[#cdb4ff]/20" />
                  <span className="font-jakarta font-bold text-sm text-gray-500">I confirm this report is accurate.</span>
                </div>
              )}
            </GlassCard>
          ))}

          <Button disabled={submitting} className="w-full !py-6 !text-lg !rounded-3xl mt-8 shadow-2xl">
            {submitting ? "Storing on Walrus..." : "Submit Response →"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function RatingInput({ onChange }: { onChange: (val: number) => void }) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => { setRating(s); onChange(s); }} className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${(hover || rating) >= s ? 'bg-[#cdb4ff]/10 border-[#cdb4ff] text-[#4a2e8c] shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={(hover || rating) >= s ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
        </button>
      ))}
    </div>
  );
}

function SuccessState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center relative">
      <AppBackground />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full relative z-10">
        <div className="mb-12 flex justify-center text-[#4a2e8c]">
           <svg width="120" height="120" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M30 50L45 65L70 35" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="text-4xl font-outfit font-bold mb-4">Response Recorded</h1>
        <p className="text-gray-500 font-jakarta font-medium mb-12">Every byte is now permanently onchain.</p>
        <GlassCard className="!p-6 !bg-white/95 mb-8 text-left border-black/5 shadow-xl">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-jakarta font-bold text-gray-400 uppercase tracking-wider mb-1">Walrus Blob ID</div>
              <div className="font-jakarta font-bold text-xs text-[#4a2e8c] truncate">0x7a2b9c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u</div>
            </div>
          </div>
          <button className="w-full mt-6 py-2.5 border border-[#cdb4ff] rounded-xl text-[#4a2e8c] font-outfit font-bold text-xs hover:bg-[#cdb4ff]/10 transition-all">Verify on Explorer →</button>
        </GlassCard>
        <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-black font-jakarta font-bold text-sm transition-colors">Submit Another Response</button>
      </motion.div>
    </div>
  );
}
