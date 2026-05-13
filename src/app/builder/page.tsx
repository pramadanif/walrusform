"use client";

import React, { useState } from 'react';
import { GlassCard, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import AppBackground from '@/components/AppBackground';
import Image from 'next/image';

const FIELD_TYPES = [
  { id: 'text', label: 'Rich Text', icon: 'T', color: '#cdb4ff' },
  { id: 'dropdown', label: 'Dropdown', icon: '▼', color: '#e0f2fe' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑', color: '#dcfce7' },
  { id: 'rating', label: 'Star Rating', icon: '★', color: '#fae8ff' },
  { id: 'screenshot', label: 'Screenshot', icon: '🖼', color: '#f5f3ff' },
  { id: 'video', label: 'Video Upload', icon: '▶', color: '#ecfeff' },
  { id: 'url', label: 'URL Link', icon: '🔗', color: '#f0f4ff' },
  { id: 'confirm', label: 'Confirmation', icon: '✓', color: '#e6f0ff' },
];

export default function BuilderPage() {
  const [formTitle, setFormTitle] = useState('My Community Feedback');
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const router = useRouter();

  const addField = (type: any) => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      type: type.id,
      label: `Enter ${type.label} label...`,
      required: false,
      placeholder: '',
      helpText: '',
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="h-screen flex flex-col relative text-black bg-[#e6f0ff] overflow-hidden">
      <AppBackground />
      
      <div className="flex flex-col h-full relative z-10">
        {/* Top Header Builder */}
        <header className="glass-card !bg-white/80 !rounded-none border-x-0 border-t-0 h-20 flex items-center px-8 z-50 shadow-lg">
          <div className="flex items-center gap-6 flex-1">
            <div 
              className="w-12 h-12 bg-[#4a2e8c] rounded-2xl flex items-center justify-center cursor-pointer hover:rotate-12 transition-transform shadow-lg"
              onClick={() => router.push('/dashboard')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <input 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-transparent border-none outline-none font-outfit font-bold text-xl text-black w-full max-w-md focus:text-[#4a2e8c] transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-jakarta font-bold text-[10px] text-gray-400 uppercase tracking-widest">Permanent Storage Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="!px-6 !py-2.5 !text-sm border-black/5 shadow-sm">Preview</Button>
            <Button onClick={() => router.push(`/form/${Math.random().toString(36).substr(2, 9)}`)} className="!px-8 !py-2.5 !text-sm shadow-xl">Deploy to Walrus</Button>
            <div className="h-8 w-[1px] bg-black/10 mx-2"></div>
            <div className="glass-card !bg-white/90 !p-2 px-4 rounded-full border-black/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#cdb4ff] flex items-center justify-center text-[#4a2e8c] font-bold text-xs">MB</div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Components */}
          <aside className="w-[320px] glass-card !bg-white/90 !rounded-none border-y-0 border-l-0 p-8 flex flex-col gap-8 overflow-y-auto shadow-2xl">
            <div>
              <h3 className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest mb-6">Component Library</h3>
              <div className="grid grid-cols-1 gap-3">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => addField(type)}
                    className="glass-card !bg-white !p-4 flex items-center gap-4 hover:!border-[#cdb4ff] group text-left transition-all !rounded-2xl border-black/[0.03] shadow-sm hover:shadow-md"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all group-hover:scale-110" style={{ backgroundColor: `${type.color}30`, color: '#4a2e8c' }}>
                      {type.icon}
                    </div>
                    <span className="font-jakarta font-bold text-[14px] text-gray-600 group-hover:text-black">{type.label}</span>
                    <svg className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Mascot in Sidebar */}
            <div className="mt-auto relative h-40 group cursor-help">
              <div className="absolute inset-0 bg-[#4a2e8c]/5 rounded-3xl blur-2xl group-hover:bg-[#4a2e8c]/10 transition-all"></div>
              <Image src="/wal-footer.avif" alt="Mascot" fill className="object-contain translate-y-10 group-hover:translate-y-0 transition-transform duration-700" />
              <div className="absolute top-0 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-white px-3 py-1 rounded-full shadow-lg text-[10px] font-bold text-[#4a2e8c] border border-black/5">Drag me to build!</span>
              </div>
            </div>
          </aside>

          {/* Center Canvas: Interactive Builder */}
          <main className="flex-1 overflow-y-auto p-16 custom-scrollbar relative">
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="popLayout">
                {fields.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-[500px] border-2 border-dashed border-[#cdb4ff]/40 rounded-[40px] flex flex-col items-center justify-center text-center p-16 bg-white/40 backdrop-blur-sm"
                  >
                    <div className="relative w-32 h-32 mb-8 animate-float">
                      <Image src="/alkimi-hero.avif" alt="Mascot" fill className="object-contain" />
                    </div>
                    <h3 className="text-2xl font-outfit font-bold mb-3 text-[#4a2e8c]">Start your session</h3>
                    <p className="font-jakarta font-medium text-gray-400 max-w-xs">Pick a component from the left to begin building your decentralized form.</p>
                  </motion.div>
                ) : (
                  <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-6 pb-20">
                    {fields.map((field) => (
                      <Reorder.Item 
                        key={field.id} 
                        value={field}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`glass-card !p-8 flex items-center gap-8 cursor-move transition-all !bg-white/95 !rounded-[32px] border-white shadow-lg ${selectedFieldId === field.id ? 'ring-4 ring-[#cdb4ff]/30 border-[#cdb4ff]' : 'hover:shadow-xl'}`}
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        <div className="flex flex-col gap-1 text-gray-200 group-hover:text-[#cdb4ff] transition-colors">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 5h6M9 12h6M9 19h6"/></svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-outfit font-bold text-lg text-black mb-1">{field.label}</div>
                          <div className="flex items-center gap-3">
                            <div className="font-jakarta font-bold text-[10px] text-[#4a2e8c] uppercase tracking-widest bg-[#cdb4ff]/20 px-3 py-1 rounded-full border border-[#cdb4ff]/30">
                              {FIELD_TYPES.find(t => t.id === field.type)?.label}
                            </div>
                            {field.required && (
                              <span className="text-red-400 font-jakarta font-bold text-[10px] uppercase tracking-widest">Required</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} 
                            className="w-10 h-10 rounded-full bg-red-50 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all flex items-center justify-center border border-red-100"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* Right Sidebar: Properties */}
          <aside className="w-[360px] glass-card !bg-white/90 !rounded-none border-y-0 border-r-0 p-8 flex flex-col gap-8 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">Field Settings</h3>
              {selectedField && (
                <div className="bg-[#4a2e8c]/5 px-2 py-1 rounded-md text-[9px] font-bold text-[#4a2e8c] border border-[#4a2e8c]/10">ACTIVE</div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedField ? (
                <motion.div 
                  key={selectedField.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Label Text</label>
                    <input 
                      value={selectedField.label} 
                      onChange={(e) => { const n = [...fields]; n[fields.indexOf(selectedField)].label = e.target.value; setFields(n); }} 
                      className="w-full bg-gray-50 border border-black/5 rounded-[20px] px-5 py-4 font-jakarta font-bold text-sm text-black outline-none focus:border-[#cdb4ff] focus:bg-white shadow-inner transition-all" 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-jakarta font-bold text-gray-400 uppercase tracking-widest ml-1">Placeholder</label>
                    <input 
                      value={selectedField.placeholder} 
                      onChange={(e) => { const n = [...fields]; n[fields.indexOf(selectedField)].placeholder = e.target.value; setFields(n); }} 
                      className="w-full bg-gray-50 border border-black/5 rounded-[20px] px-5 py-4 font-jakarta font-bold text-sm text-black outline-none focus:border-[#cdb4ff] focus:bg-white shadow-inner transition-all" 
                    />
                  </div>

                  <div className="p-6 bg-[#4a2e8c]/5 rounded-[24px] border border-[#4a2e8c]/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-jakarta font-bold text-[#4a2e8c] uppercase tracking-widest">Mandatory Field</label>
                      <button 
                        onClick={() => { const n = [...fields]; n[fields.indexOf(selectedField)].required = !selectedField.required; setFields(n); }} 
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${selectedField.required ? 'bg-[#4a2e8c]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${selectedField.required ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button variant="danger" className="w-full !py-4 !text-sm shadow-sm hover:shadow-red-200" onClick={() => deleteField(selectedField.id)}>Remove Component</Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-black/5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                  <p className="font-jakarta font-bold text-gray-400 text-xs leading-relaxed">Select a component on the canvas to configure its settings.</p>
                </div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </div>
  );
}
