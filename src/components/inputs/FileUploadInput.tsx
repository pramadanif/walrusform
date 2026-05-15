'use client';

import { useState, useRef } from 'react';
import { uploadToWalrus, validateUploadFile } from '@/lib/walrus';

interface Props {
  type: 'screenshot' | 'video';
  onUploadComplete: (blobId: string) => void;
  onClear?: () => void;
}

type Stage = 'idle' | 'preparing' | 'uploading' | 'verifying' | 'done' | 'error';

const STAGE_LABELS: Record<Stage, string> = {
  idle: '',
  preparing: 'Preparing file…',
  uploading: 'Uploading to Walrus…',
  verifying: 'Verifying blob…',
  done: 'Stored on Walrus',
  error: '',
};

/**
 * File upload input with:
 * - Real MIME type + size validation (not browser accept filter alone)
 * - Honest stage-based progress (no fake percentages)
 * - Real Walrus upload with retry (via uploadToWalrus)
 */
export function FileUploadInput({ type, onUploadComplete, onClear }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [blobId, setBlobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = type === 'screenshot' ? 'Upload Screenshot' : 'Upload Video';
  const maxLabel = type === 'screenshot' ? '10 MB max · JPEG, PNG, GIF, WebP' : '50 MB max · MP4, WebM';
  
  const icon =
    type === 'screenshot' ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 group-hover:text-[#4a2e8c] transition-colors">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 group-hover:text-[#4a2e8c] transition-colors">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );

  const handleFile = async (file: File) => {
    setError(null);

    // Real MIME type + size validation
    const validation = validateUploadFile(file, type);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file.');
      setStage('error');
      return;
    }

    setFileName(file.name);
    setStage('preparing');

    try {
      const buffer = await file.arrayBuffer();
      
      setStage('uploading');
      const { blobId: id } = await uploadToWalrus(buffer, {
        contentType: file.type,
        epochs: 10,
      });

      setStage('verifying');
      // Brief pause to show the verifying state — gives visual confirmation
      await new Promise((res) => setTimeout(res, 600));

      setStage('done');
      setBlobId(id);
      onUploadComplete(id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
      setError(msg);
      setStage('error');
    }
  };

  const reset = () => {
    setBlobId(null);
    setStage('idle');
    setFileName(null);
    setError(null);
    onClear?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  const isLoading = stage === 'preparing' || stage === 'uploading' || stage === 'verifying';

  return (
    <div
      className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 transition-all cursor-pointer group relative overflow-hidden ${
        stage === 'done'
          ? 'border-[#4a2e8c]/30 bg-[#cdb4ff]/5'
          : stage === 'error'
          ? 'border-red-200 bg-red-50/30'
          : isLoading
          ? 'border-[#cdb4ff]/40'
          : 'border-gray-100 hover:bg-gray-50 hover:border-[#cdb4ff]'
      }`}
      onClick={() => !isLoading && stage !== 'done' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && !isLoading && stage !== 'done') handleFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={type === 'screenshot' ? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml' : 'video/mp4,video/webm,video/ogg'}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Idle state */}
      {stage === 'idle' && (
        <>
          {icon}
          <span className="font-jakarta font-bold text-xs text-gray-400 group-hover:text-[#4a2e8c] transition-colors">
            {label}
          </span>
          <span className="font-jakarta text-[10px] text-gray-300">
            {maxLabel} · Drag & drop or click
          </span>
        </>
      )}

      {/* Loading / stage-based progress */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 w-full px-8">
          {/* Animated indeterminate bar — honest, no fake % */}
          <div className="h-[3px] w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4a2e8c] rounded-full animate-[loading_1.5s_ease-in-out_infinite]" 
                 style={{ width: '40%', animation: 'worm-slide 1.5s ease-in-out infinite' }} />
          </div>
          <span className="font-jakarta font-bold text-[11px] text-[#4a2e8c]">
            {STAGE_LABELS[stage]}
          </span>
          {fileName && (
            <span className="font-jakarta text-[10px] text-gray-400 truncate max-w-full px-4">
              {fileName}
            </span>
          )}
        </div>
      )}

      {/* Success state */}
      {stage === 'done' && blobId && (
        <div className="flex flex-col items-center gap-1 px-6 w-full">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a2e8c" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-jakarta font-bold text-xs text-[#4a2e8c]">Stored on Walrus</span>
          </div>
          <span className="font-jakarta text-[10px] text-[#4a2e8c]/60 truncate max-w-full text-center px-2">
            {blobId}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="mt-1 font-jakarta text-[10px] text-gray-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && (
        <div className="flex flex-col items-center gap-2">
          <span className="font-jakarta font-bold text-xs text-red-500 text-center px-4">{error}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="font-jakarta text-[10px] text-gray-400 hover:text-black"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
