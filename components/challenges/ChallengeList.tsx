import React, { useState } from 'react';
import { useAllVaults } from '../../hooks/challenges/useAllVaults';
import { useVaultDetails } from '../../hooks/challenges/useVaultDetails';
import { VaultInfo } from '../../types/index';
import ChallengeCard from './ChallengeCard';
import CreateChallengeModal from './CreateChallengeModal';
import JoinChallengeModal from './JoinChallengeModal';
import SubmitNumberModal from './SubmitNumberModal';
import QRScanner, { ethereumAddressValidator } from '../shared/QRScanner';

interface ChallengeListProps {
  userAddress?: string;
  chainId: number;
}

const ChallengeList: React.FC<ChallengeListProps> = ({ userAddress, chainId }) => {
  const { data: vaultAddresses = [], isLoading: loadingAddresses } = useAllVaults(chainId);
  const { data: vaults = [], isLoading: loadingDetails } = useVaultDetails(vaultAddresses, chainId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinVault, setJoinVault] = useState<VaultInfo | null>(null);
  const [submitVault, setSubmitVault] = useState<VaultInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const isLoading = loadingAddresses || loadingDetails;

  const filteredVaults = searchQuery.trim()
    ? vaults.filter((v) =>
        v.address.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : vaults;

  const handleScanResult = (data: string) => {
    setSearchQuery(data);
    setIsScannerOpen(false);
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Challenges</h2>
        {userAddress && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm rounded-xl transition-all"
          >
            + Create
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vault address…"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => setIsScannerOpen(true)}
          title="Scan QR code"
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-gray-300 rounded-xl transition-all text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <rect x="7" y="7" width="4" height="4" rx="0.5" strokeWidth={1.5} />
            <rect x="13" y="7" width="4" height="4" rx="0.5" strokeWidth={1.5} />
            <rect x="7" y="13" width="4" height="4" rx="0.5" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h1M13 13h1v1" />
          </svg>
          <span className="hidden sm:inline">Scan QR</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredVaults.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">
            {searchQuery ? `No challenge found for "${searchQuery.slice(0, 10)}…"` : 'No challenges yet. Create the first one!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredVaults.map((vault) => (
            <ChallengeCard
              key={vault.address}
              vault={vault}
              userAddress={userAddress}
              chainId={chainId}
              onJoin={setJoinVault}
              onSubmit={setSubmitVault}
            />
          ))}
        </div>
      )}

      {isCreateOpen && userAddress && (
        <CreateChallengeModal
          userAddress={userAddress as `0x${string}`}
          chainId={chainId}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
        />
      )}

      {joinVault && userAddress && (
        <JoinChallengeModal
          vault={joinVault}
          userAddress={userAddress as `0x${string}`}
          chainId={chainId}
          onClose={() => setJoinVault(null)}
          onSuccess={() => setJoinVault(null)}
        />
      )}

      {submitVault && (
        <SubmitNumberModal
          vault={submitVault}
          chainId={chainId}
          onClose={() => setSubmitVault(null)}
          onSuccess={() => setSubmitVault(null)}
        />
      )}

      {isScannerOpen && (
        <QRScanner
          title="Scan Challenge QR"
          description="Point your camera at a challenge QR code to find it"
          validator={ethereumAddressValidator}
          onScan={handleScanResult}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};

export default ChallengeList;
