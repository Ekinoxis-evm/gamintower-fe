import React from 'react';
import { useIdentityCollections, useIdentityStatus } from '../../hooks/identity';

interface IdentityStatusProps {
  userAddress: string;
  chainId: number;
  onMintClick: (collectionAddress: `0x${string}`) => void;
  onRenewClick: (collectionAddress: `0x${string}`, tokenId: bigint) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-green-400 bg-green-400/10 border-green-400/30',
  Expired: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Suspended: 'text-red-400 bg-red-400/10 border-red-400/30',
  None: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

function formatExpiry(expiry: bigint | null): string {
  if (!expiry) return '—';
  const date = new Date(Number(expiry) * 1000);
  return date.toLocaleDateString();
}

interface StatusCardProps {
  userAddress: string;
  collectionAddress: `0x${string}`;
  chainId: number;
  onMintClick: (collectionAddress: `0x${string}`) => void;
  onRenewClick: (collectionAddress: `0x${string}`, tokenId: bigint) => void;
}

function StatusCard({ userAddress, collectionAddress, chainId, onMintClick, onRenewClick }: StatusCardProps) {
  const { data: status, isLoading } = useIdentityStatus(userAddress, collectionAddress, chainId);

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-24" />
      </div>
    );
  }

  const currentStatus = status?.status ?? 'None';
  const colorClass = STATUS_COLORS[currentStatus] ?? STATUS_COLORS['None'];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400 font-mono">
          {collectionAddress.slice(0, 6)}...{collectionAddress.slice(-4)}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
          {currentStatus}
        </span>
      </div>
      {status && status.expiry !== null && (
        <p className="text-xs text-gray-500 mb-3">
          Expires: {formatExpiry(status.expiry)}
        </p>
      )}
      <div className="flex gap-2">
        {currentStatus === 'None' && (
          <button
            onClick={() => onMintClick(collectionAddress)}
            className="flex-1 py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg transition-all"
          >
            Get Identity
          </button>
        )}
        {(currentStatus === 'Active' || currentStatus === 'Expired') && (
          <button
            onClick={() => onRenewClick(collectionAddress, status?.tokenId ?? BigInt(0))}
            className="flex-1 py-1.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg transition-all"
          >
            Renew
          </button>
        )}
      </div>
    </div>
  );
}

const IdentityStatusComponent: React.FC<IdentityStatusProps> = ({
  userAddress,
  chainId,
  onMintClick,
  onRenewClick,
}) => {
  const { data: collections = [], isLoading } = useIdentityCollections(chainId);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <p className="text-gray-400 text-sm">Loading collections...</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">No identity collections deployed yet.</p>
        <p className="text-gray-600 text-xs">Admin can deploy a collection from the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Identities</h3>
      {collections.map((addr) => (
        <StatusCard
          key={addr}
          userAddress={userAddress}
          collectionAddress={addr}
          chainId={chainId}
          onMintClick={onMintClick}
          onRenewClick={onRenewClick}
        />
      ))}
    </div>
  );
};

export default IdentityStatusComponent;
