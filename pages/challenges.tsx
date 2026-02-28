import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import Loading from '../components/shared/Loading';
import Navigation from '../components/Navigation';
import ChallengeList from '../components/challenges/ChallengeList';
import ChallengeAdminPanel from '../components/challenges/ChallengeAdminPanel';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function ChallengesPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const chainId = 8453;
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Versus</h1>
          <p className="text-gray-400 text-sm mt-1">
            2-player staking number game. A valid Game Pass is required to create or join a match.
          </p>
        </div>

        <ChallengeList
          chainId={chainId}
          userAddress={userAddress as `0x${string}` | undefined}
        />

        {isAdmin && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-xs text-gray-500 uppercase font-mono mb-4">Admin</p>
            <ChallengeAdminPanel chainId={chainId} />
          </div>
        )}
      </main>
    </div>
  );
}
