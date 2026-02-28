import React, { useState } from 'react';

interface Buy1UPModalProps {
  walletAddress: string;
  onClose: () => void;
}

const COP_PER_1UP = 1000;

const Buy1UPModal: React.FC<Buy1UPModalProps> = ({ walletAddress, onClose }) => {
  const [copAmount, setCopAmount] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [owner, setOwner] = useState('');
  const [cc, setCc] = useState('');

  const parsedCop = parseFloat(copAmount) || 0;
  const oneUpAmount = parsedCop >= COP_PER_1UP ? Math.floor(parsedCop / COP_PER_1UP) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = [
      '🎮 *1UP Purchase Order*',
      '',
      `💰 Amount: ${parsedCop.toLocaleString('es-CO')} COP`,
      `🎯 1UP to receive: ${oneUpAmount} 1UP`,
      `👛 Wallet: ${walletAddress}`,
      '',
      '💳 *Payment Details*',
      `Bank: ${bank}`,
      `Account: ${account}`,
      `Account Holder: ${owner}`,
      `CC / ID: ${cc}`,
    ];

    const message = lines.join('\n');
    const telegramUrl = `https://t.me/ekinoxis?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
    onClose();
  };

  const isValid =
    parsedCop >= COP_PER_1UP &&
    bank.trim() !== '' &&
    account.trim() !== '' &&
    owner.trim() !== '' &&
    cc.trim() !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Buy 1UP</h2>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">1 UP = 1,000 COP</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* COP Amount */}
          <div>
            <label className="block text-xs text-gray-400 font-mono uppercase mb-1.5 tracking-wider">
              Amount in COP
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">$</span>
              <input
                type="number"
                min={COP_PER_1UP}
                step={COP_PER_1UP}
                value={copAmount}
                onChange={(e) => setCopAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg pl-7 pr-16 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">COP</span>
            </div>
            {parsedCop > 0 && parsedCop < COP_PER_1UP && (
              <p className="text-red-400 text-xs mt-1 font-mono">Minimum 1,000 COP (1 UP)</p>
            )}
          </div>

          {/* 1UP Preview */}
          <div className="bg-slate-800/60 border border-cyan-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 text-sm">You will receive</span>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold text-xl font-mono">
                {oneUpAmount.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm font-mono">1UP</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3 pt-1">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Payment Method</p>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Bank</label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="e.g. Bancolombia"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Number</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Account number"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Holder</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Full name"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">CC / ID</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="ID number"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!isValid}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors font-mono text-sm"
            >
              Continue on Telegram →
            </button>
            <p className="text-center text-gray-500 text-xs mt-3">
              You will be redirected to Telegram @ekinoxis to complete your order.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Buy1UPModal;
