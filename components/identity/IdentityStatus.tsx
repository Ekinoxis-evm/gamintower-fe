import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import {
  useIdentityCollections,
  useIdentityStatus,
  useIdentityTokenConfigs,
  useCollectionInfo,
  useIdentityMetadata,
} from '../../hooks/identity';
import type { NFTAttribute } from '../../hooks/identity';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';
import { resolveIpfsUrl } from '../../utils/ipfs';
import { getNftExplorerUrl } from '../../config/contracts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdentityStatusProps {
  userAddress: string;
  chainId: number;
  onMintClick: (collectionAddress: `0x${string}`) => void;
  onRenewClick: (collectionAddress: `0x${string}`, tokenId: bigint) => void;
}

interface StatusCardProps extends IdentityStatusProps {
  collectionAddress: `0x${string}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  Active: {
    dot: 'bg-emerald-400',
    badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    label: 'Active',
  },
  Expired: {
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    label: 'Expired',
  },
  Suspended: {
    dot: 'bg-rose-400',
    badge: 'text-rose-400 bg-rose-400/10 border-rose-400/25',
    label: 'Suspended',
  },
  None: {
    dot: 'bg-slate-500',
    badge: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    label: 'Not minted',
  },
};

const SOCIAL_LINK_MAP: Record<string, (value: string) => string | null> = {
  Instagram: (v) => `https://www.instagram.com/${v.replace(/^@/, '')}`,
  Telegram: (v) => `https://t.me/${v.replace(/^@/, '')}`,
  TikTok: (v) => `https://www.tiktok.com/@${v.replace(/^@/, '')}`,
  Discord: () => null,
};

// ─── Brand icons (12 px for pills) ───────────────────────────────────────────

function IconInstagram() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.67l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.889z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z" />
    </svg>
  );
}

function IconDiscord() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const SOCIAL_ICON: Record<string, React.ReactNode> = {
  Instagram: <IconInstagram />,
  Telegram: <IconTelegram />,
  TikTok: <IconTikTok />,
  Discord: <IconDiscord />,
};

const SOCIAL_COLOR: Record<string, string> = {
  Instagram: 'text-pink-400',
  Telegram: 'text-sky-400',
  TikTok: 'text-white',
  Discord: 'text-indigo-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpiry(expiry: bigint | null): string {
  if (!expiry) return '—';
  return new Date(Number(expiry) * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isExpiringSoon(expiry: bigint | null): boolean {
  if (!expiry) return false;
  const daysLeft = (Number(expiry) * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
  return daysLeft > 0 && daysLeft <= 30;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarPlaceholder({ size = 52 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function SocialPill({ attr }: { attr: NFTAttribute }) {
  const href = SOCIAL_LINK_MAP[attr.trait_type]?.(attr.value) ?? null;
  const handle = attr.value.startsWith('@') ? attr.value : `@${attr.value}`;
  const icon = SOCIAL_ICON[attr.trait_type];
  const colorClass = SOCIAL_COLOR[attr.trait_type] ?? 'text-slate-400';

  const inner = (
    <span className="flex items-center gap-1.5 text-[11px] bg-slate-800 border border-slate-700 rounded-full px-2.5 py-0.5 leading-5 whitespace-nowrap">
      <span className={colorClass}>{icon}</span>
      <span className="text-slate-300">{handle}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 hover:ring-1 hover:ring-slate-500 rounded-full transition-opacity">
        {inner}
      </a>
    );
  }
  return inner;
}

function PricingTable({
  configs,
  configsLoading,
}: {
  configs: ReturnType<typeof useIdentityTokenConfigs>['data'];
  configsLoading: boolean;
}) {
  const enabled = (configs ?? []).filter((c) => c.enabled);

  if (configsLoading) {
    return (
      <div className="space-y-1.5">
        {[40, 56, 48].map((w) => (
          <div key={w} className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  if (enabled.length === 0) {
    return (
      <p className="text-xs text-amber-500/80">Pricing not yet configured — check back soon.</p>
    );
  }

  return (
    <div className="space-y-3">
      {enabled.map((cfg) => {
        const meta = getTokenMetaByAddress(cfg.token);
        return (
          <div key={cfg.token}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">
              Pay with {meta.symbol}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Mint fee', price: cfg.mintPrice, show: cfg.mintPrice > BigInt(0) },
                { label: 'Monthly', price: cfg.monthlyPrice, show: true },
                { label: 'Yearly', price: cfg.yearlyPrice, show: true },
              ]
                .filter((r) => r.show)
                .map(({ label, price }) => (
                  <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2.5 py-2 text-center">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-slate-200 font-mono tabular-nums">
                      {formatUnits(price, meta.decimals)}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-0.5">{meta.symbol}</p>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

function StatusCard({
  userAddress,
  collectionAddress,
  chainId,
  onMintClick,
  onRenewClick,
}: StatusCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: status, isLoading: statusLoading } = useIdentityStatus(
    userAddress,
    collectionAddress,
    chainId,
  );
  const { data: info, isLoading: infoLoading } = useCollectionInfo(collectionAddress, chainId);
  const { data: tokenConfigs, isLoading: configsLoading } = useIdentityTokenConfigs(
    collectionAddress,
    chainId,
  );
  const { data: metadata, isLoading: metadataLoading } = useIdentityMetadata(
    collectionAddress,
    status?.tokenId,
    chainId,
  );

  // Reset avatar error and loaded state whenever the source image changes (e.g. after renewal)
  useEffect(() => {
    setAvatarError(false);
    setImageLoaded(false);
  }, [metadata?.image]);

  const isLoading = statusLoading || infoLoading;

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-4 animate-pulse">
        <div className="flex gap-3">
          <div className="w-13 h-13 rounded-full bg-slate-800 flex-shrink-0" style={{ width: 52, height: 52 }} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-slate-800 rounded w-36" />
            <div className="h-3 bg-slate-800 rounded w-24" />
            <div className="h-3 bg-slate-800 rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = status?.status ?? 'None';
  const style = STATUS_STYLE[currentStatus] ?? STATUS_STYLE['None'];
  const hasToken = currentStatus !== 'None';
  const enabledConfigs = (tokenConfigs ?? []).filter((c) => c.enabled);
  const hasConfigs = enabledConfigs.length > 0;
  const socials = (metadata?.attributes ?? []).filter(
    (a) => ['Instagram', 'Telegram', 'TikTok', 'Discord'].includes(a.trait_type),
  );
  const avatarSrc =
    !avatarError && metadata?.image ? resolveIpfsUrl(metadata.image) : null;
  const nftUrl = hasToken && status?.tokenId
    ? getNftExplorerUrl(chainId, collectionAddress, status.tokenId)
    : null;
  const expiringSoon = isExpiringSoon(status?.expiry ?? null);

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">

      {/* ── Card body ── */}
      <div className="p-4 space-y-4">

        {/* Row 1: identity / collection header */}
        <div className="flex items-start gap-3">

          {/* Avatar — only shown when user has a token */}
          {hasToken && (
            <div className="flex-shrink-0">
              {metadataLoading ? (
                <div className="w-[52px] h-[52px] rounded-full bg-slate-800 animate-pulse" />
              ) : avatarSrc ? (
                <div className="relative w-[52px] h-[52px] rounded-full overflow-hidden ring-2 ring-slate-700">
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-full" />
                  )}
                  <Image
                    src={avatarSrc}
                    alt={metadata?.name ?? 'Identity'}
                    fill
                    className="object-cover"
                    unoptimized
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setAvatarError(true)}
                  />
                </div>
              ) : (
                <AvatarPlaceholder size={52} />
              )}
            </div>
          )}

          {/* Text info */}
          <div className="flex-1 min-w-0">

            {/* Name (metadata) or collection name */}
            {hasToken ? (
              metadataLoading ? (
                <div className="h-4 bg-slate-800 rounded w-32 animate-pulse mb-1" />
              ) : (
                <p className="text-white font-semibold text-[15px] leading-tight truncate">
                  {metadata?.name ?? '—'}
                </p>
              )
            ) : (
              <p className="text-white font-semibold text-[15px] leading-tight truncate">
                {info?.name || 'Identity Collection'}
              </p>
            )}

            {/* Collection name + city (secondary) */}
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {info?.name ?? 'Collection'}
              {info?.city ? ` · ${info.city}` : ''}
            </p>

            {/* Token ID row — shown only when user has a token */}
            {hasToken && status?.tokenId !== undefined && status.tokenId > BigInt(0) && (
              <p className="text-slate-600 text-[11px] font-mono mt-0.5">
                Token #{status.tokenId.toString()}
              </p>
            )}
          </div>

          {/* Status badge + soulbound */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            {info?.soulbound && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-violet-500/25 text-violet-400/80 bg-violet-400/8">
                Soulbound
              </span>
            )}
          </div>
        </div>

        {/* ── Existing-holder block ── */}
        {hasToken && (
          <>
            {/* Socials */}
            {!metadataLoading && socials.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {socials.map((attr) => (
                  <SocialPill key={attr.trait_type} attr={attr} />
                ))}
                {metadata?.external_url && (
                  <a
                    href={metadata.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400/80 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-0.5 leading-5 hover:opacity-80 transition-opacity"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            )}

            {/* Expiry + explorer link */}
            <div className="flex items-center justify-between">
              <div>
                {status?.expiry !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">
                      {currentStatus === 'Expired' ? 'Expired' : 'Expires'}
                    </span>
                    <span className={`text-[11px] font-medium ${expiringSoon ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatExpiry(status?.expiry ?? null)}
                    </span>
                    {expiringSoon && (
                      <span className="text-[10px] text-amber-400/70 bg-amber-400/8 border border-amber-400/20 rounded-full px-1.5 py-px">
                        soon
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* View on explorer */}
              {nftUrl && (
                <a
                  href={nftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  View on chain
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </>
        )}

        {/* ── No token: show pricing ── */}
        {currentStatus === 'None' && (
          <div className="border-t border-slate-800 pt-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">Pricing</p>
            <PricingTable configs={tokenConfigs} configsLoading={configsLoading} />
          </div>
        )}

        {/* Stats chip */}
        {info && info.totalSupply > BigInt(0) && (
          <p className="text-[10px] text-slate-600">
            {info.totalSupply.toString()} {info.totalSupply === BigInt(1) ? 'identity' : 'identities'} issued
          </p>
        )}
      </div>

      {/* ── Action footer ── */}
      {(currentStatus === 'None' && hasConfigs) || currentStatus === 'Active' || currentStatus === 'Expired' ? (
        <div className="px-4 pb-4">
          {currentStatus === 'None' && hasConfigs && (
            <button
              onClick={() => onMintClick(collectionAddress)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-sm font-bold transition-colors"
            >
              Get Identity Card
            </button>
          )}
          {(currentStatus === 'Active' || currentStatus === 'Expired') && (
            <button
              onClick={() => onRenewClick(collectionAddress, status?.tokenId ?? BigInt(0))}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                expiringSoon || currentStatus === 'Expired'
                  ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300'
              }`}
            >
              Renew Subscription
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── List wrapper ─────────────────────────────────────────────────────────────

const IdentityStatusComponent: React.FC<IdentityStatusProps> = (props) => {
  const { data: collections = [], isLoading } = useIdentityCollections(props.chainId);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-40" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 text-center space-y-1">
        <p className="text-slate-400 text-sm">No identity collections deployed yet.</p>
        <p className="text-slate-600 text-xs">An admin can deploy a collection from the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">
        Your Identities
      </h3>
      {collections.map((addr) => (
        <StatusCard key={addr} {...props} collectionAddress={addr} />
      ))}
    </div>
  );
};

export default IdentityStatusComponent;
