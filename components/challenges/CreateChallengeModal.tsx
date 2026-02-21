import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { parseUnits } from 'viem';
import { useAcceptedTokens } from '../../hooks/challenges/useAcceptedTokens';
import { useCreateChallenge } from '../../hooks/challenges/useCreateChallenge';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';

interface CreateChallengeModalProps {
  userAddress: `0x${string}`;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  userAddress: _userAddress,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [metadataURI, setMetadataURI] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: acceptedTokens = [], isLoading } = useAcceptedTokens(chainId);
  const { createChallenge } = useCreateChallenge();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const selectedToken = acceptedTokens[selectedTokenIdx];
  const selectedMeta = selectedToken ? getTokenMetaByAddress(selectedToken) : null;

  const handleCreate = async () => {
    if (!stakeAmount || !durationHours || acceptedTokens.length === 0 || !selectedMeta) {
      setError('Please fill all required fields');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createChallenge({
        tokenAddress: acceptedTokens[selectedTokenIdx],
        stakeAmount: parseUnits(stakeAmount, selectedMeta.decimals),
        duration: BigInt(Number(durationHours) * 3600),
        metadataURI,
        chainId,
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

        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading tokens...</p>
        ) : acceptedTokens.length === 0 ? (
          <p className="text-yellow-400 text-sm">No accepted tokens configured.</p>
        ) : (
          <div className="space-y-4">
            {/* Token picker */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Token</label>
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full flex items-center gap-3 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 hover:border-slate-500 transition-colors"
                >
                  {selectedMeta && (
                    <Image
                      src={selectedMeta.logoUrl}
                      alt={selectedMeta.symbol}
                      width={24}
                      height={24}
                      className="rounded-full flex-shrink-0"
                      unoptimized
                    />
                  )}
                  <span className="font-semibold">{selectedMeta?.symbol ?? '—'}</span>
                  <span className="text-gray-400 text-xs">{selectedMeta?.name}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Options */}
                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                    {acceptedTokens.map((token, idx) => {
                      const meta = getTokenMetaByAddress(token);
                      const isSelected = idx === selectedTokenIdx;
                      return (
                        <button
                          key={token}
                          type="button"
                          onClick={() => {
                            setSelectedTokenIdx(idx);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left
                            ${isSelected
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'text-white hover:bg-slate-700'
                            }`}
                        >
                          <Image
                            src={meta.logoUrl}
                            alt={meta.symbol}
                            width={24}
                            height={24}
                            className="rounded-full flex-shrink-0"
                            unoptimized
                          />
                          <span className="font-semibold">{meta.symbol}</span>
                          <span className="text-gray-400 text-xs">{meta.name}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 ml-auto text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Duration (hours)</label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="24"
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
        )}
      </div>
    </div>
  );
};

export default CreateChallengeModal;
