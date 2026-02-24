import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import Loading from '../components/shared/Loading';
import Navigation from '../components/Navigation';
import CourseList from '../components/courses/CourseList';
import CourseAdminPanel from '../components/courses/CourseAdminPanel';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function CoursesPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const chainId = 8453;
  const { data: isAdmin } = useIsAdmin(chainId);

  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) return <Loading fullScreen text="Loading..." />;
  if (!authenticated) return <Loading fullScreen text="Redirecting..." />;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-gray-400 text-sm mt-1">
            Mint course NFTs to unlock private educational content.
          </p>
        </div>

        <CourseList chainId={chainId} />

        {isAdmin && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-xs text-gray-500 uppercase font-mono mb-4">Admin</p>
            <CourseAdminPanel chainId={chainId} />
          </div>
        )}
      </main>
    </div>
  );
}
