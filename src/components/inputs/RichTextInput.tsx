'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface Props {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * Headless Tiptap rich text editor styled to exactly match the existing
 * textarea elements on /form/[id] — same bg, border, radius, font, shadow.
 * No Tiptap default styles are applied.
 */
export function RichTextInput({ value, onChange, placeholder, required }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Write here...' }),
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        // Match existing textarea classes from /form/[id]/page.tsx exactly
        class:
          'min-h-[100px] outline-none font-jakarta font-medium text-black text-sm leading-relaxed',
      },
    },
  });

  return (
    <div
      className="w-full bg-gray-50 border border-black/5 rounded-2xl px-5 py-4 outline-none focus-within:border-[#cdb4ff] focus-within:ring-4 focus-within:ring-[#cdb4ff]/10 transition-all shadow-inner"
      style={{ minHeight: '120px' }}
    >
      {/* Toolbar — minimal, matches design language */}
      {editor && (
        <div className="flex gap-1 mb-3 pb-2 border-b border-black/[0.04]">
          {[
            {
              label: 'B',
              className: 'font-bold',
              action: () => editor.chain().focus().toggleBold().run(),
              active: editor.isActive('bold'),
            },
            {
              label: 'I',
              className: 'italic',
              action: () => editor.chain().focus().toggleItalic().run(),
              active: editor.isActive('italic'),
            },
            {
              label: '—',
              className: '',
              action: () => editor.chain().focus().toggleStrike().run(),
              active: editor.isActive('strike'),
            },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-outfit text-xs transition-all ${
                btn.active
                  ? 'bg-[#cdb4ff]/20 text-[#4a2e8c] border border-[#cdb4ff]/40'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              } ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
      <EditorContent editor={editor} />
      {/* Hidden native input for form required validation */}
      <input
        type="text"
        required={required}
        value={editor?.getText() ?? ''}
        onChange={() => {}}
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
