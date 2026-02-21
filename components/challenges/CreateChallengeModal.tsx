import React, { useState, useEffect } from 'react';
import { parseUnits } from 'viem';
import { useAcceptedTokens } from '../../hooks/challenges/useAcceptedTokens';
import { useCreateChallenge } from '../../hooks/challenges/useCreateChallenge';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';
import TokenPicker from '../shared/TokenPicker';

interface CreateChallengeModalProps {
  userAddress: `0x${string}`;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  userAddress,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [selectedToken, setSelectedToken] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('300');
  const [metadataURI, setMetadataURI] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: acceptedTokens = [], isLoading } = useAcceptedTokens(chainId);
  const { createChallenge } = useCreateChallenge();

  // Auto-select first token when the list loads
  useEffect(() => {
    if (acceptedTokens.length > 0 && !selectedToken) {
      setSelectedToken(acceptedTokens[0]);
    }
  }, [acceptedTokens, selectedToken]);

  const selectedMeta = selectedToken ? getTokenMetaByAddress(selectedToken) : null;

  const handleCreate = async () => {
    if (!stakeAmount || !durationSeconds || !selectedToken || !selectedMeta) {
      setError('Please fill all required fields');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createChallenge({
        tokenAddress: selectedToken as `0x${string}`,
        stakeAmount: parseUnits(stakeAmount, selectedMeta.decimals),
        duration: BigInt(Number(durationSeconds)),
        metadataURI,
        chainId,
        userAddress,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Create Challenge</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Token</label>
            <TokenPicker
              tokens={acceptedTokens}
              value={selectedToken}
              onChange={setSelectedToken}
              isLoading={isLoading}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Stake Amount (tokens)</label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="10"
              min="0"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Duration (seconds)</label>
            <input
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="300"
              min="1"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Metadata URI (optional)</label>
            <input
              type="text"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://..."
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
          >
            {isCreating ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
