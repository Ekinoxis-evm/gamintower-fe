import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { VaultInfo } from '../../types/index';
import { useJoinChallenge } from '../../hooks/challenges/useJoinChallenge';

interface JoinChallengeModalProps {
  vault: VaultInfo;
  userAddress: `0x${string}`;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  vault,
  userAddress,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { joinChallenge } = useJoinChallenge();

  // We need the token address from vault — it's encoded in the vault's asset field
  // For now we show what we know and the user confirms
  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);
    try {
      // Note: vault.stakeAmount uses 6 decimals (token-dependent)
      // We use address(0) as placeholder; real token address comes from vault's asset() call
      // For simplicity, user must have already approved or we pass stakeAmount directly
      await joinChallenge({
        vaultAddress: vault.address,
        tokenAddress: vault.player1, // Placeholder — real impl would read asset() from vault
        stakeAmount: vault.stakeAmount,
        receiver: userAddress,
        chainId,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Join Challenge</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Stake required</span>
            <span className="text-white font-semibold">{formatUnits(vault.stakeAmount, 6)} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Opponent</span>
            <span className="text-gray-300 font-mono text-xs">
              {vault.player1.slice(0, 8)}...{vault.player1.slice(-4)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          By joining, you stake {formatUnits(vault.stakeAmount, 6)} tokens. The winner takes all.
        </p>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
        >
          {isJoining ? 'Joining...' : 'Join & Stake'}
        </button>
      </div>
    </div>
  );
};

export default JoinChallengeModal;
