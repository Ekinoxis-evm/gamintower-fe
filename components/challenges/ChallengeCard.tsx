import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { VaultInfo } from '../../types/index';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';

const STATE_LABELS: Record<number, string> = {
  0: 'OPEN',
  1: 'ACTIVE',
  2: 'RESOLVED',
};

const STATE_COLORS: Record<number, string> = {
  0: 'text-green-400 bg-green-400/10 border-green-400/30',
  1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  2: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function formatCountdown(endTime: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (endTime === BigInt(0)) return '—';
  if (endTime <= now) return 'Ended';
  const diff = Number(endTime - now);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

interface ChallengeCardProps {
  vault: VaultInfo;
  userAddress?: string;
  onJoin: (vault: VaultInfo) => void;
  onSubmit: (vault: VaultInfo) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ vault, userAddress, onJoin, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const tokenMeta = getTokenMetaByAddress(vault.token);
  const stateLabel = STATE_LABELS[vault.state] ?? 'UNKNOWN';
  const stateColor = STATE_COLORS[vault.state] ?? STATE_COLORS[2];

  const isPlayer = userAddress && (
    vault.player1.toLowerCase() === userAddress.toLowerCase() ||
    vault.player2.toLowerCase() === userAddress.toLowerCase()
  );
  const canJoin = vault.state === 0 && vault.player2 === ZERO_ADDRESS &&
    userAddress && vault.player1.toLowerCase() !== userAddress.toLowerCase();
  const now = BigInt(Math.floor(Date.now() / 1000));
  const canSubmit = vault.state === 1 && isPlayer && vault.endTime <= now;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stateColor}`}>
          {stateLabel}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
        </span>
      </div>

      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Stake</span>
          <span className="text-white font-semibold">
            {formatUnits(vault.stakeAmount, tokenMeta.decimals)} {tokenMeta.symbol}
          </span>
        </div>
        {vault.state === 1 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Time left</span>
            <span className="text-yellow-400">{formatCountdown(vault.endTime)}</span>
          </div>
        )}
        {vault.state === 2 && vault.winner !== ZERO_ADDRESS && (
          <div className="flex justify-between">
            <span className="text-gray-400">Winner</span>
            <span className="text-green-400 font-mono text-xs">
              {vault.winner.slice(0, 6)}...{vault.winner.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="text-xs text-gray-500 space-y-1 mb-3 pt-2 border-t border-slate-700">
          <div>Player 1: <span className="font-mono">{vault.player1.slice(0, 10)}...</span></div>
          {vault.player2 !== ZERO_ADDRESS && (
            <div>Player 2: <span className="font-mono">{vault.player2.slice(0, 10)}...</span></div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? 'Less' : 'Details'}
        </button>
        <div className="flex-1" />
        {canJoin && (
          <button
            onClick={() => onJoin(vault)}
            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg transition-all"
          >
            Join
          </button>
        )}
        {canSubmit && (
          <button
            onClick={() => onSubmit(vault)}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg transition-all"
          >
            Submit Number
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;
