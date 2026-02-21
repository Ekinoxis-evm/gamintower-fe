import React, { useState } from 'react';
import { useDeployCollection } from '../../hooks/identity/useDeployCollection';
import { useIdentityAdminActions } from '../../hooks/identity/useIdentityAdminActions';
import { useIdentityCollections } from '../../hooks/identity/useIdentityCollections';

interface IdentityAdminPanelProps {
  chainId: number;
}

const IdentityAdminPanel: React.FC<IdentityAdminPanelProps> = ({ chainId }) => {
  const [activeSection, setActiveSection] = useState<'deploy' | 'config'>('deploy');

  // Deploy form state
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [city, setCity] = useState('');
  const [treasury, setTreasury] = useState('');
  const [soulbound, setSoulbound] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Token config state
  const [selectedCollection, setSelectedCollection] = useState('');
  const [tokenAddr, setTokenAddr] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const { deployCollection } = useDeployCollection();
  const { setTokenConfig } = useIdentityAdminActions();
  const { data: collections = [] } = useIdentityCollections(chainId);

  const handleDeploy = async () => {
    if (!name || !symbol || !city || !treasury) {
      setDeployError('All fields required');
      return;
    }
    setIsDeploying(true);
    setDeployError(null);
    try {
      await deployCollection({
        name,
        symbol,
        city,
        treasury: treasury as `0x${string}`,
        soulbound,
        initialTokens: [],
        chainId,
      });
      setName(''); setSymbol(''); setCity(''); setTreasury('');
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Failed to deploy');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSetTokenConfig = async () => {
    if (!selectedCollection || !tokenAddr) {
      setConfigError('Collection and token address required');
      return;
    }
    setIsSaving(true);
    setConfigError(null);
    try {
      await setTokenConfig(
        selectedCollection as `0x${string}`,
        tokenAddr as `0x${string}`,
        BigInt(mintPrice || '0'),
        BigInt(monthlyPrice || '0'),
        BigInt(yearlyPrice || '0'),
        chainId,
      );
      setTokenAddr(''); setMintPrice(''); setMonthlyPrice(''); setYearlyPrice('');
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Identity Admin</h2>

      <div className="flex gap-2 mb-5">
        {(['deploy', 'config'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeSection === s
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                : 'bg-slate-800 border border-slate-600 text-gray-400'
            }`}
          >
            {s === 'deploy' ? 'Deploy Collection' : 'Token Config'}
          </button>
        ))}
      </div>

      {activeSection === 'deploy' && (
        <div className="space-y-3">
          {[
            { label: 'Name', value: name, setter: setName, placeholder: 'ETH Cali Identity' },
            { label: 'Symbol', value: symbol, setter: setSymbol, placeholder: 'ETHCID' },
            { label: 'City', value: city, setter: setCity, placeholder: 'Cali' },
            { label: 'Treasury', value: treasury, setter: setTreasury, placeholder: '0x...' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 block mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={soulbound}
              onChange={(e) => setSoulbound(e.target.checked)}
              className="accent-cyan-500"
            />
            Soulbound (non-transferable)
          </label>
          {deployError && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {deployError}
            </p>
          )}
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-all"
          >
            {isDeploying ? 'Deploying...' : 'Deploy Collection'}
          </button>
        </div>
      )}

      {activeSection === 'config' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select collection...</option>
              {collections.map((addr) => (
                <option key={addr} value={addr}>
                  {addr.slice(0, 10)}...{addr.slice(-6)}
                </option>
              ))}
            </select>
          </div>
          {[
            { label: 'Token Address', value: tokenAddr, setter: setTokenAddr, placeholder: '0x...' },
            { label: 'Mint Price (raw)', value: mintPrice, setter: setMintPrice, placeholder: '0' },
            { label: 'Monthly Price (raw)', value: monthlyPrice, setter: setMonthlyPrice, placeholder: '0' },
            { label: 'Yearly Price (raw)', value: yearlyPrice, setter: setYearlyPrice, placeholder: '0' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 block mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
          {configError && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {configError}
            </p>
          )}
          <button
            onClick={handleSetTokenConfig}
            disabled={isSaving}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
          >
            {isSaving ? 'Saving...' : 'Set Token Config'}
          </button>
        </div>
      )}
    </div>
  );
};

export default IdentityAdminPanel;
