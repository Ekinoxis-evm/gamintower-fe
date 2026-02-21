import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { VaultInfo } from '../../types/index';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';
import { useVaultSubmissions } from '../../hooks/challenges/useVaultSubmissions';
import { useResolveDispute } from '../../hooks/challenges/useResolveDispute';
import { useClaimWinnings } from '../../hooks/challenges/useClaimWinnings';
import { useQueryClient } from '@tanstack/react-query';

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
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDuration(secs: bigint): string {
  const n = Number(secs);
  if (n === 0) return '—';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  return `${s}s`;
}

function formatTs(unix: bigint): string {
  if (unix === BigInt(0)) return '—';
  return new Date(Number(unix) * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface ChallengeCardProps {
  vault: VaultInfo;
  userAddress?: string;
  chainId: number;
  onJoin: (vault: VaultInfo) => void;
  onSubmit: (vault: VaultInfo) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ vault, userAddress, chainId, onJoin, onSubmit }) => {
  const [expanded, setExpanded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const tokenMeta = getTokenMetaByAddress(vault.token);
  const stateLabel = STATE_LABELS[vault.state] ?? 'UNKNOWN';
  const stateColor = STATE_COLORS[vault.state] ?? STATE_COLORS[2];

  const now = BigInt(Math.floor(Date.now() / 1000));
  const endTimePassed = vault.endTime > BigInt(0) && vault.endTime <= now;

  const isPlayer = Boolean(userAddress) && (
    vault.player1.toLowerCase() === userAddress!.toLowerCase() ||
    vault.player2.toLowerCase() === userAddress!.toLowerCase()
  );
  const isResolver = Boolean(userAddress) &&
    vault.resolver !== ZERO_ADDRESS &&
    vault.resolver.toLowerCase() === userAddress!.toLowerCase();
  const isWinner = Boolean(userAddress) &&
    vault.winner !== ZERO_ADDRESS &&
    vault.winner.toLowerCase() === userAddress!.toLowerCase();

  const canJoin = vault.state === 0 &&
    vault.player2 === ZERO_ADDRESS &&
    Boolean(userAddress) &&
    vault.player1.toLowerCase() !== userAddress!.toLowerCase();

  // Fetch submission status whenever ACTIVE or RESOLVED
  const needsSubmissions = vault.state === 1 || vault.state === 2;
  const { data: submissions } = useVaultSubmissions(
    vault.address, vault.player1, vault.player2, userAddress, chainId, needsSubmissions,
  );

  const { resolveDispute } = useResolveDispute();
  const { claimWinnings } = useClaimWinnings();

  const userIsPlayer1 = userAddress && vault.player1.toLowerCase() === userAddress.toLowerCase();
  const userIsPlayer1Only = userIsPlayer1 && vault.player2 === ZERO_ADDRESS; // created but no opponent yet
  const userHasSubmitted = userIsPlayer1 ? submissions?.player1Submitted : submissions?.player2Submitted;
  const bothSubmitted = submissions?.player1Submitted && submissions?.player2Submitted;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(vault.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vault-details'] });
    queryClient.invalidateQueries({ queryKey: ['vault-submissions'] });
  };

  const handleResolve = async (winner: `0x${string}`) => {
    setIsResolving(true);
    setActionError(null);
    try {
      await resolveDispute(vault.address, winner, chainId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Resolve failed');
    } finally {
      setIsResolving(false);
    }
  };

  const handleClaim = async () => {
    if (!userAddress || !submissions) return;
    setIsClaiming(true);
    setActionError(null);
    try {
      await claimWinnings(vault.address, submissions.userShares, userAddress as `0x${string}`, chainId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stateColor}`}>
          {stateLabel}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
        </span>
      </div>

      {/* Core info */}
      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Stake</span>
          <span className="text-white font-semibold">
            {formatUnits(vault.stakeAmount, tokenMeta.decimals)} {tokenMeta.symbol}
          </span>
        </div>

        {/* Timing row */}
        {vault.state === 0 && vault.challengeDuration > BigInt(0) && (
          <div className="flex justify-between">
            <span className="text-gray-400">Duration</span>
            <span className="text-gray-300">{formatDuration(vault.challengeDuration)}</span>
          </div>
        )}
        {vault.state === 1 && vault.endTime > BigInt(0) && vault.challengeDuration > BigInt(0) && (
          <div className="flex justify-between">
            <span className="text-gray-400">Started</span>
            <span className="text-gray-300">{formatTs(vault.endTime - vault.challengeDuration)}</span>
          </div>
        )}
        {vault.state === 2 && vault.endTime > BigInt(0) && (
          <div className="flex justify-between">
            <span className="text-gray-400">Ended</span>
            <span className="text-gray-300">{formatTs(vault.endTime)}</span>
          </div>
        )}

        {/* Awaiting opponent banner */}
        {vault.state === 0 && userIsPlayer1Only && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-xs text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2">
              Waiting for an opponent to join. Share the vault address below.
            </p>
            <button
              onClick={handleCopyAddress}
              className="mt-2 w-full text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-600 text-gray-300 rounded-lg px-3 py-2 text-left truncate transition-colors"
            >
              {copied ? '✓ Copied!' : vault.address}
            </button>
          </div>
        )}

        {vault.state === 1 && !endTimePassed && (
          <div className="flex justify-between">
            <span className="text-gray-400">Time left</span>
            <span className="text-yellow-400">{formatCountdown(vault.endTime)}</span>
          </div>
        )}

        {/* Submission status (ACTIVE) */}
        {vault.state === 1 && submissions && (isPlayer || isResolver) && (
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submissions</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-mono">{vault.player1.slice(0, 6)}…</span>
              <span className={submissions.player1Submitted ? 'text-green-400' : 'text-gray-500'}>
                {submissions.player1Submitted ? `✓ ${submissions.player1Number.toString()}` : 'Pending'}
              </span>
            </div>
            {vault.player2 !== ZERO_ADDRESS && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-mono">{vault.player2.slice(0, 6)}…</span>
                <span className={submissions.player2Submitted ? 'text-green-400' : 'text-gray-500'}>
                  {submissions.player2Submitted ? `✓ ${submissions.player2Number.toString()}` : 'Pending'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Winner (RESOLVED) */}
        {vault.state === 2 && vault.winner !== ZERO_ADDRESS && (
          <div className="flex justify-between">
            <span className="text-gray-400">Winner</span>
            <span className={`font-mono text-xs ${isWinner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
              {isWinner ? '🏆 You' : `${vault.winner.slice(0, 6)}...${vault.winner.slice(-4)}`}
            </span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="text-xs text-gray-500 space-y-1 mb-3 pt-2 border-t border-slate-700">
          <div>Player 1: <span className="font-mono">{vault.player1.slice(0, 10)}...</span></div>
          {vault.player2 !== ZERO_ADDRESS && (
            <div>Player 2: <span className="font-mono">{vault.player2.slice(0, 10)}...</span></div>
          )}
          {vault.resolver !== ZERO_ADDRESS && (
            <div>Resolver: <span className="font-mono">{vault.resolver.slice(0, 10)}...</span></div>
          )}
        </div>
      )}

      {/* Error */}
      {actionError && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-3">
          {actionError}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? 'Less' : 'Details'}
        </button>
        <button
          onClick={handleRefresh}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          title="Refresh status"
        >
          ↻
        </button>
        <div className="flex-1" />

        {/* Join */}
        {canJoin && (
          <button
            onClick={() => onJoin(vault)}
            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg transition-all"
          >
            Join
          </button>
        )}

        {/* Submit number — show whenever ACTIVE + player + not yet submitted */}
        {vault.state === 1 && isPlayer && !userHasSubmitted && (
          <button
            onClick={() => onSubmit(vault)}
            disabled={!endTimePassed}
            title={!endTimePassed ? 'Available once the challenge timer ends' : undefined}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {endTimePassed ? 'Submit Number' : 'Submit (timer running…)'}
          </button>
        )}

        {/* Already submitted, waiting for opponent */}
        {vault.state === 1 && isPlayer && userHasSubmitted && !bothSubmitted && (
          <span className="text-xs text-gray-500 italic">Waiting for opponent…</span>
        )}

        {/* Resolver: pick winner — once both submitted */}
        {vault.state === 1 && isResolver && bothSubmitted && (
          <div className="flex gap-1.5 w-full mt-1">
            <button
              onClick={() => handleResolve(vault.player1)}
              disabled={isResolving}
              className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
            >
              {isResolving ? '…' : 'P1 Wins'}
            </button>
            <button
              onClick={() => handleResolve(vault.player2)}
              disabled={isResolving}
              className="flex-1 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
            >
              {isResolving ? '…' : 'P2 Wins'}
            </button>
          </div>
        )}

        {/* Claim winnings */}
        {vault.state === 2 && isWinner && submissions && submissions.userShares > BigInt(0) && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-all"
          >
            {isClaiming ? 'Claiming…' : '🏆 Claim Winnings'}
          </button>
        )}

        {/* Already claimed */}
        {vault.state === 2 && isWinner && submissions && submissions.userShares === BigInt(0) && (
          <span className="text-xs text-green-400">✓ Claimed</span>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;
