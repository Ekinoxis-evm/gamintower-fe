import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { useIdentityTokenConfigs } from '../../hooks/identity/useIdentityTokenConfigs';
import { useIdentityMint, type MintPeriod } from '../../hooks/identity/useIdentityMint';

interface IdentityMintModalProps {
  collectionAddress: `0x${string}`;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const IdentityMintModal: React.FC<IdentityMintModalProps> = ({
  collectionAddress,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [period, setPeriod] = useState<MintPeriod>(0);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0);
  const [metadataURI, setMetadataURI] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenConfigs = [], isLoading } = useIdentityTokenConfigs(collectionAddress, chainId);
  const { mint } = useIdentityMint();

  const enabledConfigs = tokenConfigs.filter((c) => c.enabled);
  const selectedConfig = enabledConfigs[selectedTokenIdx];

  const price = selectedConfig
    ? period === 0
      ? selectedConfig.monthlyPrice
      : selectedConfig.yearlyPrice
    : BigInt(0);

  const approvalAmount = price + selectedConfig?.mintPrice ?? BigInt(0);

  const handleMint = async () => {
    if (!selectedConfig) return;
    setIsMinting(true);
    setError(null);
    try {
      await mint({
        collectionAddress,
        tokenAddress: selectedConfig.token,
        approvalAmount,
        metadataURI,
        period,
        chainId,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Get Identity Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading payment options...</p>
        ) : enabledConfigs.length === 0 ? (
          <p className="text-yellow-400 text-sm">No payment tokens configured for this collection.</p>
        ) : (
          <div className="space-y-4">
            {/* Period selector */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Period</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Monthly', 'Yearly'] as const).map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setPeriod(idx as MintPeriod)}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                      period === idx
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-800 border-slate-600 text-gray-400 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Token selector */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Pay with</label>
              <select
                value={selectedTokenIdx}
                onChange={(e) => setSelectedTokenIdx(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              >
                {enabledConfigs.map((cfg, idx) => (
                  <option key={cfg.token} value={idx}>
                    {cfg.token.slice(0, 6)}...{cfg.token.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Metadata URI */}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Metadata URI (optional)</label>
              <input
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="ipfs://..."
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600"
              />
            </div>

            {/* Price display */}
            {selectedConfig && (
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mint fee</span>
                  <span className="text-white">{formatUnits(selectedConfig.mintPrice, 6)} tokens</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Subscription</span>
                  <span className="text-white">{formatUnits(price, 6)} tokens</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-700 font-semibold">
                  <span className="text-gray-300">Total</span>
                  <span className="text-cyan-400">{formatUnits(approvalAmount, 6)} tokens</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleMint}
              disabled={isMinting || !selectedConfig}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
            >
              {isMinting ? 'Processing...' : 'Mint Identity Card'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityMintModal;
