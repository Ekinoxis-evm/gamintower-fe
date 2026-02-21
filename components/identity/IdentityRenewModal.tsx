import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { useIdentityTokenConfigs } from '../../hooks/identity/useIdentityTokenConfigs';
import { useIdentityRenew } from '../../hooks/identity/useIdentityRenew';
import type { MintPeriod } from '../../hooks/identity/useIdentityMint';

interface IdentityRenewModalProps {
  collectionAddress: `0x${string}`;
  tokenId: bigint;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const IdentityRenewModal: React.FC<IdentityRenewModalProps> = ({
  collectionAddress,
  tokenId,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [period, setPeriod] = useState<MintPeriod>(0);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0);
  const [isRenewing, setIsRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenConfigs = [], isLoading } = useIdentityTokenConfigs(collectionAddress, chainId);
  const { renew } = useIdentityRenew();

  const enabledConfigs = tokenConfigs.filter((c) => c.enabled);
  const selectedConfig = enabledConfigs[selectedTokenIdx];
  const price = selectedConfig
    ? period === 0 ? selectedConfig.monthlyPrice : selectedConfig.yearlyPrice
    : BigInt(0);

  const handleRenew = async () => {
    if (!selectedConfig) return;
    setIsRenewing(true);
    setError(null);
    try {
      await renew({
        collectionAddress,
        tokenAddress: selectedConfig.token,
        approvalAmount: price,
        tokenId,
        period,
        chainId,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Renew Identity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading payment options...</p>
        ) : enabledConfigs.length === 0 ? (
          <p className="text-yellow-400 text-sm">No payment tokens configured.</p>
        ) : (
          <div className="space-y-4">
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
                        : 'bg-slate-800 border-slate-600 text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

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

            {selectedConfig && (
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-300">Total</span>
                  <span className="text-cyan-400">{formatUnits(price, 6)} tokens</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleRenew}
              disabled={isRenewing || !selectedConfig}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              {isRenewing ? 'Processing...' : 'Renew Identity'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityRenewModal;
