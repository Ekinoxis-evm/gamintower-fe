import React, { useState } from 'react';
import { VaultInfo } from '../../types/index';
import { useSubmitNumber } from '../../hooks/challenges/useSubmitNumber';

interface SubmitNumberModalProps {
  vault: VaultInfo;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitNumberModal: React.FC<SubmitNumberModalProps> = ({
  vault,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [number, setNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { submitNumber } = useSubmitNumber();

  const handleSubmit = async () => {
    if (!number || isNaN(Number(number))) {
      setError('Please enter a valid number');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await submitNumber({
        vaultAddress: vault.address,
        number: BigInt(number),
        chainId,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Submit Number</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Submit your number after the challenge end time. The player closest to the target wins.
        </p>

        <div className="mb-4">
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Your Number</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="42"
            min="0"
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default SubmitNumberModal;
