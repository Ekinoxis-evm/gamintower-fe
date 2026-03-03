import React, { useState } from 'react';
import { useIdentityMetadata } from '../../hooks/identity/useIdentityMetadata';
import { resolveIpfsUrl } from '../../utils/ipfs';
import type { HolderInfo } from '../../hooks/identity/useAllGamePassHolders';

interface GamePassPlayerCardProps {
  holder: HolderInfo;
  chainId: number;
}

const STATUS_LABELS: Record<0 | 1 | 2, string> = {
  0: 'Active',
  1: 'Expired',
  2: 'Suspended',
};

const STATUS_CLASSES: Record<0 | 1 | 2, string> = {
  0: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  1: 'bg-slate-700/50 text-gray-400 border-slate-600',
  2: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const SOCIAL_CONFIGS: { trait: string; label: string; buildUrl: (handle: string) => string; icon: React.ReactNode }[] = [
  {
    trait: 'Twitter',
    label: 'X / Twitter',
    buildUrl: (h) => `https://x.com/${h}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.25 2.25h6.927l4.264 5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    trait: 'Instagram',
    label: 'Instagram',
    buildUrl: (h) => `https://instagram.com/${h}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    trait: 'Telegram',
    label: 'Telegram',
    buildUrl: (h) => `https://t.me/${h}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    trait: 'TikTok',
    label: 'TikTok',
    buildUrl: (h) => `https://tiktok.com/@${h}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z" />
      </svg>
    ),
  },
];

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatExpiry(expiry: bigint): string {
  const ts = Number(expiry) * 1000;
  if (ts === 0) return 'Unknown';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const GamePassPlayerCard: React.FC<GamePassPlayerCardProps> = ({ holder, chainId }) => {
  const [copied, setCopied] = useState(false);

  const { data: metadata, isLoading: metaLoading } = useIdentityMetadata(
    holder.collectionAddress,
    holder.tokenId,
    chainId,
  );

  const avatarUrl = metadata?.image ? resolveIpfsUrl(metadata.image) : null;
  const displayName = metadata?.name ?? truncateAddress(holder.owner);

  const socialLinks = SOCIAL_CONFIGS.flatMap((cfg) => {
    const attr = metadata?.attributes?.find(
      (a) => a.trait_type.toLowerCase() === cfg.trait.toLowerCase(),
    );
    if (!attr?.value) return [];
    return [{ ...cfg, handle: attr.value }];
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(holder.owner).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
      {/* Avatar + name + status */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center">
          {metaLoading ? (
            <div className="w-full h-full animate-pulse bg-slate-700 rounded-full" />
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-gray-500 text-lg">👤</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {metaLoading ? (
              <span className="inline-block w-28 h-4 bg-slate-700 animate-pulse rounded" />
            ) : (
              displayName
            )}
          </p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CLASSES[holder.status]}`}
          >
            {STATUS_LABELS[holder.status]}
          </span>
        </div>
      </div>

      {/* Wallet address */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-cyan-400 transition-colors text-left"
        title="Copy address"
      >
        <span>{truncateAddress(holder.owner)}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-3.5 h-3.5 flex-shrink-0"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        {copied && <span className="text-green-400 not-mono font-sans">Copied!</span>}
      </button>

      {/* Expiry (shown only when Expired) */}
      {holder.status === 1 && (
        <p className="text-xs text-gray-500">
          Expired: <span className="text-gray-400">{formatExpiry(holder.expiry)}</span>
        </p>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {socialLinks.map((link) => (
            <a
              key={link.trait}
              href={link.buildUrl(link.handle)}
              target="_blank"
              rel="noopener noreferrer"
              title={`${link.label}: ${link.handle}`}
              className="text-gray-500 hover:text-cyan-400 transition-colors"
            >
              {link.icon}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamePassPlayerCard;
