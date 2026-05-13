'use client';

import { useState, useRef } from 'react';
import { uploadToWalrus } from '@/lib/walrus';

interface Props {
  type: 'screenshot' | 'video';
  onUploadComplete: (blobId: string, file: File) => void;
  onClear?: () => void;
}

/**
 * File upload input styled exactly like the existing screenshot zone on /form/[id].
 * Handles real Walrus upload with simulated progress (Walrus HTTP has no streaming progress API).
 */
export function FileUploadInput({ type, onUploadComplete, onClear }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'screenshot' ? 'image/*' : 'video/*';
  const maxMB = type === 'screenshot' ? 10 : 200;
  const label = type === 'screenshot' ? 'Upload Screenshot' : 'Upload Video';
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
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Max ${maxMB} MB.`);
      return;
    }
    setError(null);
    setProgress(10);
    setFileName(file.name);

    try {
      // Simulate progress since Walrus HTTP PUT doesn't expose upload events
      const progressTimer = setInterval(() => {
        setProgress((p) => (p !== null && p < 80 ? p + 10 : p));
      }, 600);

      const buffer = await file.arrayBuffer();
      clearInterval(progressTimer);
      setProgress(85);

      const { blobId: id } = await uploadToWalrus(buffer, {
        contentType: file.type,
        epochs: 10,
      });

      setProgress(100);
      setBlobId(id);
      onUploadComplete(id, file);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      setProgress(null);
    }
  };

  const reset = () => {
    setBlobId(null);
    setProgress(null);
    setFileName(null);
    setError(null);
    onClear?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    // Mirrors existing screenshot zone: dashed border, gray-50 bg, hover purple
    <div
      className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 transition-all cursor-pointer group relative overflow-hidden ${
        blobId
          ? 'border-[#4a2e8c]/30 bg-[#cdb4ff]/5'
          : error
          ? 'border-red-200 bg-red-50/30'
          : progress !== null && progress < 100
          ? 'border-[#cdb4ff]/40'
          : 'border-gray-100 hover:bg-gray-50 hover:border-[#cdb4ff]'
      }`}
      onClick={() => !blobId && !progress && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Idle state */}
      {progress === null && !blobId && !error && (
        <>
          {icon}
          <span className="font-jakarta font-bold text-xs text-gray-400 group-hover:text-[#4a2e8c] transition-colors">
            {label}
          </span>
          <span className="font-jakarta text-[10px] text-gray-300">
            Max {maxMB} MB · Drag & drop or click
          </span>
        </>
      )}

      {/* Progress bar */}
      {progress !== null && progress < 100 && (
        <div className="w-full px-8 flex flex-col items-center gap-2">
          <span className="font-jakarta font-bold text-xs text-[#4a2e8c]">
            Uploading to Walrus… {progress}%
          </span>
          <div className="h-[3px] w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4a2e8c] transition-all duration-500 shadow-[0_0_6px_rgba(74,46,140,0.3)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-jakarta text-[10px] text-gray-400 truncate max-w-full px-4">
            {fileName}
          </span>
        </div>
      )}

      {/* Success state */}
      {blobId && (
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
      {error && !blobId && (
        <div className="flex flex-col items-center gap-2">
          <span className="font-jakarta font-bold text-xs text-red-500">{error}</span>
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
