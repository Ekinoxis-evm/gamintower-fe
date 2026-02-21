import React, { useState } from 'react';
import { useAllVaults } from '../../hooks/challenges/useAllVaults';
import { useVaultDetails } from '../../hooks/challenges/useVaultDetails';
import { VaultInfo } from '../../types/index';
import ChallengeCard from './ChallengeCard';
import CreateChallengeModal from './CreateChallengeModal';
import JoinChallengeModal from './JoinChallengeModal';
import SubmitNumberModal from './SubmitNumberModal';

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

  const isLoading = loadingAddresses || loadingDetails;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">No challenges yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vaults.map((vault) => (
            <ChallengeCard
              key={vault.address}
              vault={vault}
              userAddress={userAddress}
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
    </div>
  );
};

export default ChallengeList;
