import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import Loading from '../../components/shared/Loading';
import Navigation from '../../components/Navigation';
import IdentityAdminPanel from '../../components/identity/IdentityAdminPanel';
import ChallengeAdminPanel from '../../components/challenges/ChallengeAdminPanel';
import CourseAdminPanel from '../../components/courses/CourseAdminPanel';
import { useIsAdmin } from '../../hooks/useIsAdmin';

type AdminTab = 'identity' | 'challenges' | 'courses';

export default function AdminPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [chainId] = useState(8453);
  const [activeTab, setActiveTab] = useState<AdminTab>('identity');
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin(chainId);

  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) return <Loading fullScreen text="Loading..." />;
  if (!authenticated) return <Loading fullScreen text="Redirecting..." />;
  if (isAdminLoading) return <Loading fullScreen text="Verifying access..." />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation currentChainId={chainId} />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-400 text-sm">This page is restricted to admins.</p>
          </div>
        </main>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'identity', label: 'Identity' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'courses', label: 'Courses' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation currentChainId={chainId} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage identity collections, challenge vaults, and courses.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 border-b-transparent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        {activeTab === 'identity' && <IdentityAdminPanel chainId={chainId} />}
        {activeTab === 'challenges' && <ChallengeAdminPanel chainId={chainId} />}
        {activeTab === 'courses' && <CourseAdminPanel chainId={chainId} />}
      </main>
    </div>
  );
}
