import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import Layout from '../components/shared/Layout';
import Loading from '../components/shared/Loading';
import WalletInfo from '../components/wallet/WalletInfo';
import Navigation from '../components/Navigation';
import { Wallet } from '../types/index';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { useActiveWallet } from '../hooks/useActiveWallet';

export default function WalletPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallet: activeWallet } = useActiveWallet();
  const chainId = 8453;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Use the active wallet (prioritizes external over embedded)
  const userWallet = activeWallet;

  // Use our custom hook to fetch real balances from Base mainnet
  const {
    balances,
    isLoading: isBalanceLoading,
    refetch: refreshBalances
  } = useTokenBalances(userWallet?.address);

  // Show loading state while Privy initializes
  if (!ready) {
    return <Loading fullScreen={true} text="Loading..." />;
  }

  // Don't render if not authenticated (will redirect)
  if (!authenticated) {
    return <Loading fullScreen={true} text="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <Layout>
        <div className="space-y-6">
          {userWallet ? (
            <div className="space-y-6">
              <WalletInfo
                wallet={userWallet as unknown as Wallet}
                balances={balances}
                isLoading={isBalanceLoading}
                onRefresh={refreshBalances}
                chainId={chainId}
              />
            </div>
          ) : (
            <div className="bg-gray-900 p-8 rounded-lg text-center shadow border border-cyan-500/30">
              <p className="mb-4 text-cyan-400 font-mono">CREATING_WALLET...</p>
              <div className="flex justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
