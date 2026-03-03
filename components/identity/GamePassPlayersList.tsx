import React, { useState } from 'react';
import { useAllGamePassHolders } from '../../hooks/identity/useAllGamePassHolders';
import GamePassPlayerCard from './GamePassPlayerCard';
import type { HolderInfo } from '../../hooks/identity/useAllGamePassHolders';

interface GamePassPlayersListProps {
  chainId: number;
}

type FilterStatus = 'all' | 0 | 1 | 2;

const FILTER_CHIPS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 0, label: 'Active' },
  { id: 1, label: 'Expired' },
  { id: 2, label: 'Suspended' },
];

const GamePassPlayersList: React.FC<GamePassPlayersListProps> = ({ chainId }) => {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { data: holders = [], isLoading, isError, error } = useAllGamePassHolders(chainId);

  const filtered: HolderInfo[] =
    filter === 'all' ? holders : holders.filter((h) => h.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Players</h2>
        {!isLoading && (
          <span className="text-xs text-gray-500">
            {filtered.length} of {holders.length}
          </span>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={String(chip.id)}
            onClick={() => setFilter(chip.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              filter === chip.id
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-gray-400 border-slate-700 hover:text-white'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 space-y-2">
          <p className="text-red-400 text-sm font-semibold">Failed to load players</p>
          {error instanceof Error && (
            <p className="text-red-400/70 text-xs font-mono break-all">{error.message}</p>
          )}
          <p className="text-gray-500 text-xs">
            Tip: the public Base RPC may not support full log scans. Set{' '}
            <code className="text-gray-400">NEXT_PUBLIC_BASE_RPC_URL</code> to a private RPC (Alchemy / QuickNode).
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            {holders.length === 0 ? 'No Game Passes minted yet.' : 'No players match this filter.'}
          </p>
        </div>
      )}

      {/* Player grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((holder) => (
            <GamePassPlayerCard
              key={`${holder.collectionAddress}-${holder.tokenId.toString()}`}
              holder={holder}
              chainId={chainId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GamePassPlayersList;
