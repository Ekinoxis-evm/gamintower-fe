import React, { useState } from 'react';
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
  Instagram: (v) => `https://instagram.com/${v.replace(/^@/, '')}`,
  Telegram: (v) => `https://t.me/${v.replace(/^@/, '')}`,
  TikTok: (v) => `https://tiktok.com/@${v.replace(/^@/, '')}`,
  Discord: () => null, // no universal link format for Discord
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
  const label = attr.value.startsWith('@') ? attr.value : `@${attr.value}`;

  const inner = (
    <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-0.5 leading-5 whitespace-nowrap">
      <span className="font-medium text-slate-500">{attr.trait_type}</span>
      <span className="text-slate-300">{label}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
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
                  <Image
                    src={avatarSrc}
                    alt={metadata?.name ?? 'Identity'}
                    fill
                    className="object-cover"
                    unoptimized
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
