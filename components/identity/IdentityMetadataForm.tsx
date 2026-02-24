import React, { useRef, useState, useCallback } from 'react';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface IdentityMetadataFormProps {
  onComplete: (metadataUri: string) => void;
  onClose: () => void;
}

type UploadPhase = 'idle' | 'uploading-image' | 'uploading-metadata' | 'done';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data-URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      if (!base64) reject(new Error('Failed to read file'));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

function SocialInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  prefix,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  prefix?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1.5">{label}</label>
      <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
        <div className="flex items-center gap-2 pl-3 text-slate-400 flex-shrink-0">
          {icon}
          {prefix && <span className="text-gray-500 text-sm select-none">{prefix}</span>}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm px-2 py-2.5 focus:outline-none placeholder-gray-600 min-w-0"
        />
      </div>
      {hint && (
        <p className="text-[11px] text-slate-500 mt-1 truncate">{hint}</p>
      )}
    </div>
  );
}

// Simple SVG icons inline to avoid any import issues
function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.67l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.889z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

const PHASE_LABELS: Record<UploadPhase, string> = {
  idle: '',
  'uploading-image': 'Uploading photo…',
  'uploading-metadata': 'Saving profile…',
  done: 'Done',
};

const IdentityMetadataForm: React.FC<IdentityMetadataFormProps> = ({ onComplete, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');

  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const isUploading = phase === 'uploading-image' || phase === 'uploading-metadata';

  const applyImageFile = useCallback((file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file (JPG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setImageError(`Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) applyImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!imageFile) {
      setError('A profile photo is required.');
      return;
    }

    try {
      // 1. Upload image
      setPhase('uploading-image');
      const base64 = await fileToBase64(imageFile);
      const imageRes = await fetch('/api/pinata/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64,
          filename: imageFile.name,
          mimeType: imageFile.type,
        }),
      });
      if (!imageRes.ok) {
        const body = await imageRes.json() as { error?: string };
        throw new Error(body.error ?? 'Image upload failed');
      }
      const { ipfsUri: imageIpfsUri } = await imageRes.json() as { ipfsUri: string };

      // 2. Build metadata JSON (OpenSea standard)
      const attributes: Array<{ trait_type: string; value: string }> = [];
      if (instagram.trim()) attributes.push({ trait_type: 'Instagram', value: instagram.trim() });
      if (discord.trim()) attributes.push({ trait_type: 'Discord', value: discord.trim() });
      if (telegram.trim()) attributes.push({ trait_type: 'Telegram', value: telegram.trim() });
      if (tiktok.trim()) attributes.push({ trait_type: 'TikTok', value: tiktok.trim() });

      const metadata: Record<string, unknown> = {
        name: name.trim(),
        image: imageIpfsUri,
        ...(website.trim() ? { external_url: website.trim() } : {}),
        ...(attributes.length > 0 ? { attributes } : {}),
      };

      // 3. Upload metadata JSON
      setPhase('uploading-metadata');
      const metaRes = await fetch('/api/pinata/upload-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      if (!metaRes.ok) {
        const body = await metaRes.json() as { error?: string };
        throw new Error(body.error ?? 'Metadata upload failed');
      }
      const { ipfsUri: metadataIpfsUri } = await metaRes.json() as { ipfsUri: string };

      setPhase('done');
      onComplete(metadataIpfsUri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setPhase('idle');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
        <span className="bg-cyan-500 text-black rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">1</span>
        <span>Profile Card</span>
        <span className="text-slate-700">→</span>
        <span className="text-slate-700">2</span>
        <span className="text-slate-700">Payment</span>
      </div>

      {/* Image upload */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">
          Profile Photo <span className="text-red-400">*</span>
        </label>

        {imagePreview ? (
          <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{imageFile?.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 0} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); setImageError(null); }}
              className="text-xs text-gray-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-2.5 py-1.5 transition-all flex-shrink-0"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all ${
              isDragging
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <span className="text-gray-500">
              <IconUpload />
            </span>
            <span className="text-sm text-gray-400">Click to upload or drag & drop</span>
            <span className="text-xs text-gray-600">JPG, PNG, GIF, WebP — up to {MAX_FILE_SIZE_MB} MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {imageError && (
          <p className="text-red-400 text-xs mt-1.5">{imageError}</p>
        )}
      </div>

      {/* Display name */}
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name or alias"
          maxLength={64}
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600 transition-colors"
        />
        <div className="flex justify-between mt-1">
          <span />
          <span className={`text-[11px] ${name.length > 54 ? 'text-amber-400' : 'text-slate-600'}`}>
            {name.length}/64
          </span>
        </div>
      </div>

      {/* Optional social fields */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Social Links <span className="normal-case">(optional)</span></p>

        <SocialInput
          label="Instagram"
          value={instagram}
          onChange={setInstagram}
          placeholder="yourhandle"
          prefix="@"
          icon={<IconInstagram />}
          hint={instagram ? `→ https://www.instagram.com/${instagram.replace(/^@/, '')}` : undefined}
        />

        <SocialInput
          label="Discord"
          value={discord}
          onChange={setDiscord}
          placeholder="username or username#1234"
          icon={<IconDiscord />}
          hint={discord ? 'No public link — username displayed only' : undefined}
        />

        <SocialInput
          label="Telegram"
          value={telegram}
          onChange={setTelegram}
          placeholder="yourhandle"
          prefix="@"
          icon={<IconTelegram />}
          hint={telegram ? `→ https://t.me/${telegram.replace(/^@/, '')}` : undefined}
        />

        <SocialInput
          label="TikTok"
          value={tiktok}
          onChange={setTiktok}
          placeholder="yourhandle"
          prefix="@"
          icon={<IconTikTok />}
          hint={tiktok ? `→ https://www.tiktok.com/@${tiktok.replace(/^@/, '')}` : undefined}
        />

        <SocialInput
          label="Website"
          value={website}
          onChange={setWebsite}
          placeholder="https://yoursite.com"
          type="url"
          icon={<IconGlobe />}
          hint={website ? `→ ${website}` : undefined}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading}
          className="px-4 py-2.5 rounded-xl border border-slate-600 text-gray-400 text-sm font-semibold hover:border-slate-500 hover:text-white transition-all disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploading || !name.trim() || !imageFile}
          className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
              {PHASE_LABELS[phase]}
            </>
          ) : (
            'Continue to Payment →'
          )}
        </button>
      </div>
    </div>
  );
};

export default IdentityMetadataForm;
