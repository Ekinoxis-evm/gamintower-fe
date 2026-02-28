import React, { useState } from 'react';
import { formatUnits } from 'viem';
import { useIdentityTokenConfigs } from '../../hooks/identity/useIdentityTokenConfigs';
import { useIdentityMint, type MintPeriod } from '../../hooks/identity/useIdentityMint';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';
import IdentityMetadataForm from './IdentityMetadataForm';

interface IdentityMintModalProps {
  collectionAddress: `0x${string}`;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'metadata' | 'payment';

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
      <span
        className={`rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px] ${
          step === 'metadata' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-gray-400'
        }`}
      >
        1
      </span>
      <span className={step === 'metadata' ? 'text-gray-300' : 'text-slate-600'}>Profile Card</span>
      <span className="text-slate-700">→</span>
      <span
        className={`rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px] ${
          step === 'payment' ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-gray-400'
        }`}
      >
        2
      </span>
      <span className={step === 'payment' ? 'text-gray-300' : 'text-slate-600'}>Payment</span>
    </div>
  );
}

const IdentityMintModal: React.FC<IdentityMintModalProps> = ({
  collectionAddress,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('metadata');
  const [metadataUri, setMetadataUri] = useState('');

  const [period, setPeriod] = useState<MintPeriod>(0);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tokenConfigs = [], isLoading } = useIdentityTokenConfigs(collectionAddress, chainId);
  const { mint } = useIdentityMint();

  const enabledConfigs = tokenConfigs.filter((c) => c.enabled);
  const selectedConfig = enabledConfigs[selectedTokenIdx];
  const tokenMeta = selectedConfig ? getTokenMetaByAddress(selectedConfig.token) : null;

  const subscriptionPrice = selectedConfig
    ? period === 0
      ? selectedConfig.monthlyPrice
      : selectedConfig.yearlyPrice
    : BigInt(0);

  const approvalAmount = subscriptionPrice + (selectedConfig?.mintPrice ?? BigInt(0));

  const handleMetadataComplete = (uri: string) => {
    setMetadataUri(uri);
    setStep('payment');
  };

  const handleMint = async () => {
    if (!selectedConfig) return;
    setIsMinting(true);
    setError(null);
    try {
      await mint({
        collectionAddress,
        tokenAddress: selectedConfig.token,
        approvalAmount,
        metadataURI: metadataUri,
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
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Get Game Pass</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Profile card metadata */}
        {step === 'metadata' && (
          <IdentityMetadataForm
            onComplete={handleMetadataComplete}
            onClose={onClose}
          />
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className="space-y-5">
            <StepIndicator step="payment" />

            {/* Profile URI confirmation */}
            <div className="bg-slate-800 border border-green-500/20 rounded-xl p-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs text-green-400 font-semibold">Profile card saved to IPFS</p>
                <p className="text-xs text-gray-500 font-mono truncate mt-0.5">{metadataUri}</p>
              </div>
            </div>

            {isLoading ? (
              <p className="text-gray-400 text-sm">Loading payment options…</p>
            ) : enabledConfigs.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-yellow-400 text-sm font-semibold">Payment not yet configured</p>
                <p className="text-gray-500 text-xs">
                  The admin needs to set up accepted payment tokens before minting is available.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Period selector */}
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Subscription Period
                  </label>
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
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Pay with
                  </label>
                  <select
                    value={selectedTokenIdx}
                    onChange={(e) => setSelectedTokenIdx(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {enabledConfigs.map((cfg, idx) => {
                      const meta = getTokenMetaByAddress(cfg.token);
                      return (
                        <option key={cfg.token} value={idx}>
                          {meta.symbol} — {meta.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Price breakdown */}
                {selectedConfig && tokenMeta && (
                  <div className="bg-slate-800 rounded-lg p-3 space-y-1.5">
                    {selectedConfig.mintPrice > BigInt(0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Mint fee</span>
                        <span className="text-white">
                          {formatUnits(selectedConfig.mintPrice, tokenMeta.decimals)} {tokenMeta.symbol}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Subscription ({period === 0 ? 'monthly' : 'yearly'})
                      </span>
                      <span className="text-white">
                        {formatUnits(subscriptionPrice, tokenMeta.decimals)} {tokenMeta.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-1.5 border-t border-slate-700 font-semibold">
                      <span className="text-gray-300">Total</span>
                      <span className="text-cyan-400">
                        {formatUnits(approvalAmount, tokenMeta.decimals)} {tokenMeta.symbol}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('metadata'); setError(null); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-600 text-gray-400 text-sm font-semibold hover:border-slate-500 hover:text-white transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleMint}
                    disabled={isMinting || !selectedConfig}
                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isMinting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                        Processing…
                      </>
                    ) : (
                      'Mint Game Pass'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityMintModal;
