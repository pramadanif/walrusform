"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge } from '@/components/ui';
import Navbar from '@/components/Navbar';
import AppBackground from '@/components/AppBackground';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { FormField } from '@/lib/formStorage';

type Template = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tag: string;
  fields: Omit<FormField, 'id'>[];
};

const TEMPLATES: Template[] = [
  {
    id: 'walrus-session-2',
    title: 'Walrus Session 2 - Form tooling',
    description: 'Please use this form to register your form project',
    icon: '🐳',
    color: '#e0f2fe',
    tag: 'Official',
    fields: [
      { type: 'text', label: 'Project name', required: true },
      { type: 'dropdown', label: 'Please select the session', required: true, options: ['Session 1', 'Session 2'] },
      { type: 'text', label: 'Team Leader Name', required: true },
      { type: 'text', label: 'Team Leader Email', required: true },
      { type: 'checkbox', label: 'Check this if you would be open to receiving our newsletter', required: false },
      { type: 'text', label: 'Team Leader Telegram Handle', required: false },
      { type: 'text', label: 'Discord handle', required: true, placeholder: 'Make sure to join our discord since it is required and it is a way for us to contact you. https://discord.gg/walrusprotocol' },
      { type: 'text', label: 'Country', required: true },
      { type: 'text', label: 'DeepSurge project Link', required: true, placeholder: 'Needs to be on mainnet' },
      { type: 'text', label: 'Form Link', required: true },
      { type: 'checkbox', label: 'I confirm that I have submitted at least one feedback entry through the form tool I built, which includes the same fields as this form. Please make 0xc4d6ee019649edba41d5a5ed1081fe3c86afc41fea413195dd6ecdd0f6090e54 an admin so it can review the application and add other admins.', required: true },
      { type: 'richtext', label: 'Please describe the workflow and functionalities of your forms', required: true, placeholder: 'E.g. Admin flow-create a form, update form, review replies. User flow: Submit a form' },
      { type: 'screenshot', label: 'Share any visuals of your form', required: true, placeholder: 'You can upload screenshots, designs, workflow' },
      { type: 'video', label: 'Demo video of the form (sub 3 minutes)', required: true },
      { type: 'richtext', label: 'Which features sets your solution a part from the rest?', required: true },
      { type: 'richtext', label: 'Feedback (about building on Walrus)', required: true, placeholder: 'This can include but not limited to: - What worked well - Any challenges you encountered (e.g. documentation, tooling, infrastructure) - Missing features or functionalities you would like to see - Issues with access (e.g. testnet tokens, setup, onboarding) - Suggestions for improving the developer experience' },
      { type: 'text', label: 'X account', required: false, placeholder: 'By providing your account, you agree that we may tag you in the winner announcement.' },
      { type: 'text', label: 'Share link to X tweet', required: true },
      { type: 'text', label: 'SUI address', required: true },
      { type: 'richtext', label: 'GitHub', required: true, placeholder: 'Paste a link to your GitHub profiles and relevant repositories.' },
      { type: 'richtext', label: 'Session Feedback', required: false, placeholder: 'Share any thoughts on the sessions, what worked, what didn\'t, or what could be improved. This feedback is only used to improve future sessions and has no impact on rewards or participation.' },
      { type: 'richtext', label: 'DeepSurge Feedback', required: false, placeholder: 'Share any thoughts on DeepSurge, what worked, what didn\'t, or what could be improved. This feedback is only used to improve future DeepSurge and has no impact on rewards or participation.' },
      { type: 'checkbox', label: 'I confirm that I have read, understood, and agree to the rules and regulations of the session.', required: true, placeholder: 'https://thewalrussessions.wal.app/' }
    ]
  },
  {
    id: 'feedback',
    title: 'Community Feedback',
    description: 'Collect structured feedback from your protocol users or DAO members.',
    icon: '💬',
    color: '#cdb4ff',
    tag: 'Popular',
    fields: [
      { type: 'text', label: 'What should we improve?', required: true, placeholder: 'Share your feedback...' },
      { type: 'starrating', label: 'Overall experience', required: true },
      { type: 'dropdown', label: 'Primary use case', required: false, options: ['DeFi', 'DAO', 'Community', 'Developer Tool'] },
      { type: 'url', label: 'Relevant link', required: false, placeholder: 'https://' },
      { type: 'confirmation', label: 'Consent', required: true, placeholder: 'I agree to share this feedback' },
    ]
  },
  {
    id: 'grant',
    title: 'Grant Application',
    description: 'A comprehensive form for builders applying for ecosystem grants.',
    icon: '🏗️',
    color: '#e0f2fe',
    tag: 'New',
    fields: [
      { type: 'text', label: 'Project name', required: true, placeholder: 'Name your project' },
      { type: 'richtext', label: 'Project overview', required: true, placeholder: 'Describe the project and goals' },
      { type: 'dropdown', label: 'Stage', required: true, options: ['Idea', 'Prototype', 'MVP', 'Live'] },
      { type: 'url', label: 'Pitch deck', required: false, placeholder: 'https://' },
      { type: 'url', label: 'Repository', required: false, placeholder: 'https://' },
      { type: 'confirmation', label: 'I confirm this information is accurate', required: true },
    ]
  },
  {
    id: 'bug-report',
    title: 'Bug Report',
    description: 'Standardized bug reporting with screenshot and video support.',
    icon: '🐞',
    color: '#dcfce7',
    tag: 'Utility',
    fields: [
      { type: 'text', label: 'Bug title', required: true, placeholder: 'Short summary' },
      { type: 'richtext', label: 'Repro steps', required: true, placeholder: 'Step-by-step details' },
      { type: 'dropdown', label: 'Severity', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { type: 'screenshot', label: 'Screenshot', required: false },
      { type: 'video', label: 'Video capture', required: false },
      { type: 'confirmation', label: 'I confirm this report is accurate', required: true },
    ]
  },
  {
    id: 'survey',
    title: 'Market Survey',
    description: 'Understand your audience with deep analytics-ready surveys.',
    icon: '📊',
    color: '#fae8ff',
    tag: 'Deep',
    fields: [
      { type: 'text', label: 'Role', required: true, placeholder: 'Developer, Founder, Investor...' },
      { type: 'dropdown', label: 'Primary chain', required: true, options: ['Sui', 'Ethereum', 'Solana', 'Other'] },
      { type: 'starrating', label: 'Satisfaction', required: true },
      { type: 'richtext', label: 'What do you want next?', required: false, placeholder: 'Share your ideas' },
      { type: 'confirmation', label: 'May we contact you?', required: false, placeholder: 'Yes, you may follow up' },
    ]
  },
  {
    id: 'event',
    title: 'Event Registration',
    description: 'Perfect for hackathons, workshops, and community meetups.',
    icon: '🎟️',
    color: '#f5f3ff',
    tag: 'Social',
    fields: [
      { type: 'text', label: 'Full name', required: true, placeholder: 'Your name' },
      { type: 'text', label: 'Team name', required: false, placeholder: 'Optional' },
      { type: 'dropdown', label: 'Attendance type', required: true, options: ['In person', 'Virtual'] },
      { type: 'url', label: 'Portfolio', required: false, placeholder: 'https://' },
      { type: 'confirmation', label: 'I agree to the event code of conduct', required: true },
    ]
  },
  {
    id: 'whitelist',
    title: 'Whitelist Signup',
    description: 'Manage early access and exclusive community drops securely.',
    icon: '🦄',
    color: '#ecfeff',
    tag: 'DeFi',
    fields: [
      { type: 'text', label: 'Wallet address', required: true, placeholder: '0x...' },
      { type: 'dropdown', label: 'Tier', required: true, options: ['OG', 'Priority', 'Standard'] },
      { type: 'url', label: 'Referral link', required: false, placeholder: 'https://' },
      { type: 'confirmation', label: 'I accept the whitelist terms', required: true },
    ]
  }
];

export default function TemplatesPage() {
  const router = useRouter();

  const handleUseTemplate = (template: Template) => {
    const draft = {
      title: template.title,
      description: template.description,
      fields: template.fields.map((field) => ({
        ...field,
        id: crypto.randomUUID(),
      })),
    };
    localStorage.setItem('walrusform_template_draft', JSON.stringify(draft));
    router.push(`/builder?template=${template.id}`);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen relative text-black bg-[#e6f0ff] overflow-x-hidden">
      <AppBackground />
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-8 pt-44 pb-20 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#cdb4ff] text-[#4a2e8c] text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full mb-6 shadow-sm"
          >
            Start faster with templates
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-syne font-extrabold text-black mb-6 tracking-tight"
          >
            Form Gallery
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[18px] md:text-[22px] text-black/60 font-jakarta font-medium max-w-2xl"
          >
            Choose from a variety of pre-built decentralized forms or start from scratch.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {TEMPLATES.map((template) => (
            <motion.div key={template.id} variants={item}>
              <GlassCard className="h-full flex flex-col group !p-10 !rounded-[48px] hover:border-[#4a2e8c]/30">
                <div className="flex justify-between items-start mb-8">
                  <div 
                    className="w-16 h-16 flex items-center justify-center rounded-[24px] text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: `${template.color}50` }}
                  >
                    {template.icon}
                  </div>
                  <Badge color={template.tag === 'Popular' ? 'purple' : template.tag === 'New' ? 'green' : 'blue'}>
                    {template.tag}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-outfit font-bold mb-4 group-hover:text-[#4a2e8c] transition-colors">
                  {template.title}
                </h3>
                <p className="text-gray-500 font-jakarta text-[15px] leading-relaxed mb-10 flex-1">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 font-jakarta font-bold text-[10px] uppercase tracking-widest">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    {template.fields.length} Fields
                  </div>
                  <Button 
                    variant="ghost" 
                    className="!py-2 !px-5 !text-[12px] group-hover:!bg-[#4a2e8c] group-hover:!text-white transition-all"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use This
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}

          {/* Create Custom Card */}
          <motion.div variants={item}>
            <div 
              onClick={() => router.push('/builder')}
              className="h-full flex flex-col items-center justify-center text-center p-10 rounded-[48px] border-4 border-dashed border-[#cdb4ff]/40 bg-white/30 backdrop-blur-sm cursor-pointer hover:bg-white/50 hover:border-[#4a2e8c]/40 transition-all group"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <svg className="text-[#4a2e8c]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <h3 className="text-2xl font-outfit font-bold mb-3">Custom Session</h3>
              <p className="font-jakarta text-gray-400 text-sm max-w-[200px]">Start with a blank canvas and build exactly what you need.</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
