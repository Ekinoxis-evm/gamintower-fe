import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import Loading from '../components/shared/Loading';
import Navigation from '../components/Navigation';
import IdentityStatus from '../components/identity/IdentityStatus';
import IdentityMintModal from '../components/identity/IdentityMintModal';
import IdentityRenewModal from '../components/identity/IdentityRenewModal';
import IdentityAdminPanel from '../components/identity/IdentityAdminPanel';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface MintTarget {
  collectionAddress: `0x${string}`;
}

interface RenewTarget {
  collectionAddress: `0x${string}`;
  tokenId: bigint;
}

export default function IdentityPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const chainId = 8453;
  const [mintTarget, setMintTarget] = useState<MintTarget | null>(null);
  const [renewTarget, setRenewTarget] = useState<RenewTarget | null>(null);
  const { data: isAdmin } = useIsAdmin(chainId);

  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) return <Loading fullScreen text="Loading..." />;
  if (!authenticated) return <Loading fullScreen text="Redirecting..." />;

  const userAddress = user?.wallet?.address;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Game Pass</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your on-chain identity NFT. A valid Game Pass is required to participate in Versus.
          </p>
        </div>

        {userAddress ? (
          <IdentityStatus
            userAddress={userAddress}
            chainId={chainId}
            onMintClick={(collectionAddress) => setMintTarget({ collectionAddress })}
            onRenewClick={(collectionAddress, tokenId) => setRenewTarget({ collectionAddress, tokenId })}
          />
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-gray-400">Connect your wallet to view your Game Pass status.</p>
          </div>
        )}

        {isAdmin && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-xs text-gray-500 uppercase font-mono mb-4">Admin</p>
            <IdentityAdminPanel chainId={chainId} />
          </div>
        )}
      </main>

      {mintTarget && (
        <IdentityMintModal
          collectionAddress={mintTarget.collectionAddress}
          chainId={chainId}
          onClose={() => setMintTarget(null)}
          onSuccess={() => setMintTarget(null)}
        />
      )}

      {renewTarget && (
        <IdentityRenewModal
          collectionAddress={renewTarget.collectionAddress}
          tokenId={renewTarget.tokenId}
          chainId={chainId}
          onClose={() => setRenewTarget(null)}
          onSuccess={() => setRenewTarget(null)}
        />
      )}
    </div>
  );
}
