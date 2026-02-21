import React, { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useDeployCollection } from '../../hooks/identity/useDeployCollection';
import { useIdentityAdminActions } from '../../hooks/identity/useIdentityAdminActions';
import { useIdentityCollections } from '../../hooks/identity/useIdentityCollections';
import { useIdentityTokenConfigs } from '../../hooks/identity/useIdentityTokenConfigs';
import { useAcceptedTokens } from '../../hooks/challenges/useAcceptedTokens';
import TokenPicker from '../shared/TokenPicker';
import { getTokenMetaByAddress } from '../../utils/tokenUtils';

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

  // Token config state — prices entered as human-readable (e.g. "1.00")
  const [selectedCollection, setSelectedCollection] = useState('');
  const [tokenAddr, setTokenAddr] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  const { deployCollection } = useDeployCollection();
  const { setTokenConfig, disableToken } = useIdentityAdminActions();
  const { data: collections = [] } = useIdentityCollections(chainId);
  const { data: acceptedTokens = [], isLoading: tokensLoading } = useAcceptedTokens(chainId);

  // Load existing token configs for the selected collection
  const { data: existingConfigs = [], isLoading: configsLoading } = useIdentityTokenConfigs(
    selectedCollection ? (selectedCollection as `0x${string}`) : undefined,
    chainId,
  );

  const selectedTokenMeta = tokenAddr ? getTokenMetaByAddress(tokenAddr) : null;
  const tokenDecimals = selectedTokenMeta?.decimals ?? 6;

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
      const toRaw = (val: string) => {
        if (!val || val === '0') return BigInt(0);
        try {
          return parseUnits(val, tokenDecimals);
        } catch {
          throw new Error(`Invalid price value: "${val}"`);
        }
      };
      await setTokenConfig(
        selectedCollection as `0x${string}`,
        tokenAddr as `0x${string}`,
        toRaw(mintPrice),
        toRaw(monthlyPrice),
        toRaw(yearlyPrice),
        chainId,
      );
      setMintPrice(''); setMonthlyPrice(''); setYearlyPrice('');
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableToken = async (token: string) => {
    if (!selectedCollection) return;
    setIsDisabling(true);
    setConfigError(null);
    try {
      await disableToken(selectedCollection as `0x${string}`, token as `0x${string}`, chainId);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Failed to disable');
    } finally {
      setIsDisabling(false);
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
            {isDeploying ? 'Deploying…' : 'Deploy Collection'}
          </button>
        </div>
      )}

      {activeSection === 'config' && (
        <div className="space-y-4">
          {/* Collection selector */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => { setSelectedCollection(e.target.value); setTokenAddr(''); }}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select collection…</option>
              {collections.map((addr) => (
                <option key={addr} value={addr}>
                  {addr.slice(0, 10)}…{addr.slice(-6)}
                </option>
              ))}
            </select>
          </div>

          {/* Existing configs for the selected collection */}
          {selectedCollection && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Token Configs</p>
              {configsLoading ? (
                <p className="text-xs text-gray-500">Loading…</p>
              ) : existingConfigs.length === 0 ? (
                <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  No tokens configured yet — add one below.
                </p>
              ) : (
                <div className="space-y-2">
                  {existingConfigs.map((cfg) => {
                    const meta = getTokenMetaByAddress(cfg.token);
                    return (
                      <div
                        key={cfg.token}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${
                          cfg.enabled
                            ? 'bg-slate-800 border-slate-600'
                            : 'bg-slate-800/50 border-slate-700 opacity-60'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white">
                            {meta.symbol}
                            {!cfg.enabled && <span className="ml-2 text-gray-500 font-normal">(disabled)</span>}
                          </p>
                          <p className="text-gray-400 font-mono text-[11px]">
                            Mint: {formatUnits(cfg.mintPrice, meta.decimals)} · Monthly: {formatUnits(cfg.monthlyPrice, meta.decimals)} · Yearly: {formatUnits(cfg.yearlyPrice, meta.decimals)}
                          </p>
                        </div>
                        {cfg.enabled && (
                          <button
                            onClick={() => handleDisableToken(cfg.token)}
                            disabled={isDisabling}
                            className="ml-3 text-red-400 hover:text-red-300 text-xs font-semibold disabled:opacity-50"
                          >
                            Disable
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Set / update token config */}
          {selectedCollection && (
            <>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Add / Update Token</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Token</label>
                    <TokenPicker
                      tokens={acceptedTokens}
                      value={tokenAddr}
                      onChange={setTokenAddr}
                      isLoading={tokensLoading}
                    />
                  </div>

                  {selectedTokenMeta && (
                    <p className="text-xs text-gray-500">
                      Prices in <span className="text-gray-300">{selectedTokenMeta.symbol}</span> — enter human-readable amounts (e.g. <span className="text-gray-300">1.00</span> for 1 {selectedTokenMeta.symbol})
                    </p>
                  )}

                  {[
                    { label: 'Mint Price', value: mintPrice, setter: setMintPrice, placeholder: '0' },
                    { label: 'Monthly Price', value: monthlyPrice, setter: setMonthlyPrice, placeholder: '1.00' },
                    { label: 'Yearly Price', value: yearlyPrice, setter: setYearlyPrice, placeholder: '10.00' },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label}>
                      <label className="text-xs text-gray-400 block mb-1">{label}</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder={placeholder}
                          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:border-cyan-500"
                        />
                        {selectedTokenMeta && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono pointer-events-none">
                            {selectedTokenMeta.symbol}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {configError && (
                    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
                      {configError}
                    </p>
                  )}

                  <button
                    onClick={handleSetTokenConfig}
                    disabled={isSaving || !tokenAddr}
                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    {isSaving ? 'Saving…' : 'Set Token Config'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentityAdminPanel;
