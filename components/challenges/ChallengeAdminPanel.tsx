import React, { useState } from 'react';
import { useVaultAdminActions } from '../../hooks/challenges/useVaultAdminActions';

interface ChallengeAdminPanelProps {
  chainId: number;
}

const ChallengeAdminPanel: React.FC<ChallengeAdminPanelProps> = ({ chainId }) => {
  const [tokenAddr, setTokenAddr] = useState('');
  const [resolverAddr, setResolverAddr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { whitelistToken, removeToken, setResolver } = useVaultAdminActions();

  const handle = async (action: () => Promise<void>, successMsg: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      await action();
      setMessage(successMsg);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Versus Admin</h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Token Address</label>
          <input
            type="text"
            value={tokenAddr}
            onChange={(e) => setTokenAddr(e.target.value)}
            placeholder="0x..."
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handle(
                () => whitelistToken(tokenAddr as `0x${string}`, chainId),
                'Token whitelisted'
              )}
              disabled={isLoading || !tokenAddr}
              className="flex-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
            >
              Whitelist
            </button>
            <button
              onClick={() => handle(
                () => removeToken(tokenAddr as `0x${string}`, chainId),
                'Token removed'
              )}
              disabled={isLoading || !tokenAddr}
              className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
            >
              Remove
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Resolver Address</label>
          <input
            type="text"
            value={resolverAddr}
            onChange={(e) => setResolverAddr(e.target.value)}
            placeholder="0x..."
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handle(
              () => setResolver(resolverAddr as `0x${string}`, chainId),
              'Resolver updated'
            )}
            disabled={isLoading || !resolverAddr}
            className="w-full mt-2 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
          >
            Set Resolver
          </button>
        </div>

        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg border ${
            message.startsWith('Error')
              ? 'text-red-400 bg-red-400/10 border-red-400/30'
              : 'text-green-400 bg-green-400/10 border-green-400/30'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChallengeAdminPanel;
