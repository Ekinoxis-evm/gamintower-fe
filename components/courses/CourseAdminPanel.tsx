import React, { useState } from 'react';
import { parseEther } from 'viem';
import { useCreateCourse } from '../../hooks/courses/useCreateCourse';
import { useCourseAdminActions } from '../../hooks/courses/useCourseAdminActions';

interface CourseAdminPanelProps {
  chainId: number;
}

type Tab = 'create' | 'manage';

const CourseAdminPanel: React.FC<CourseAdminPanelProps> = ({ chainId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // Create course form
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [mintPrice, setMintPriceInput] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [baseURI, setBaseURI] = useState('');
  const [contentURI, setContentURI] = useState('');
  const [treasury, setTreasury] = useState('');
  const [royaltyBps, setRoyaltyBps] = useState('500');

  // Manage course form
  const [courseAddr, setCourseAddr] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newContentURI, setNewContentURI] = useState('');
  const [newBaseURI, setNewBaseURI] = useState('');
  const [newTreasury, setNewTreasury] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { createCourse } = useCreateCourse();
  const { setMintPrice: adminSetMintPrice, setPrivateContentURI, setBaseURI: updateBaseURI, setTreasury: updateTreasury, withdraw } = useCourseAdminActions();

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

  const handleCreate = () => handle(
    () => createCourse({
      name,
      symbol,
      mintPrice: parseEther(mintPrice || '0'),
      maxSupply: BigInt(maxSupply || '0'),
      baseURI,
      contentURI,
      treasury: treasury as `0x${string}`,
      royaltyBps: BigInt(royaltyBps || '0'),
      chainId,
    }),
    'Course created'
  );

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Course Admin</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['create', 'manage'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setMessage(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {tab === 'create' ? 'Create Course' : 'Manage Course'}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Course Name"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="COURSE"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mint Price (ETH)</label>
              <input
                type="text"
                value={mintPrice}
                onChange={(e) => setMintPriceInput(e.target.value)}
                placeholder="0.01"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Max Supply</label>
              <input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                placeholder="100"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Base URI</label>
            <input
              type="text"
              value={baseURI}
              onChange={(e) => setBaseURI(e.target.value)}
              placeholder="ipfs://..."
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Private Content URI</label>
            <input
              type="text"
              value={contentURI}
              onChange={(e) => setContentURI(e.target.value)}
              placeholder="ipfs://... (token-gated)"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Treasury Address</label>
              <input
                type="text"
                value={treasury}
                onChange={(e) => setTreasury(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Royalty (bps)</label>
              <input
                type="number"
                value={royaltyBps}
                onChange={(e) => setRoyaltyBps(e.target.value)}
                placeholder="500"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading || !name || !symbol || !mintPrice || !maxSupply || !treasury}
            className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Course Address</label>
            <input
              type="text"
              value={courseAddr}
              onChange={(e) => setCourseAddr(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">New Mint Price (ETH)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.01"
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handle(
                  () => adminSetMintPrice(courseAddr as `0x${string}`, parseEther(newPrice || '0'), chainId),
                  'Price updated'
                )}
                disabled={isLoading || !courseAddr || !newPrice}
                className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
              >
                Set
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">New Content URI</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newContentURI}
                onChange={(e) => setNewContentURI(e.target.value)}
                placeholder="ipfs://..."
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handle(
                  () => setPrivateContentURI(courseAddr as `0x${string}`, newContentURI, chainId),
                  'Content URI updated'
                )}
                disabled={isLoading || !courseAddr || !newContentURI}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
              >
                Set
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">New Base URI</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBaseURI}
                onChange={(e) => setNewBaseURI(e.target.value)}
                placeholder="ipfs://..."
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handle(
                  () => updateBaseURI(courseAddr as `0x${string}`, newBaseURI, chainId),
                  'Base URI updated'
                )}
                disabled={isLoading || !courseAddr || !newBaseURI}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
              >
                Set
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">New Treasury</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTreasury}
                onChange={(e) => setNewTreasury(e.target.value)}
                placeholder="0x..."
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handle(
                  () => updateTreasury(courseAddr as `0x${string}`, newTreasury as `0x${string}`, chainId),
                  'Treasury updated'
                )}
                disabled={isLoading || !courseAddr || !newTreasury}
                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all"
              >
                Set
              </button>
            </div>
          </div>

          <button
            onClick={() => handle(
              () => withdraw(courseAddr as `0x${string}`, chainId),
              'ETH withdrawn'
            )}
            disabled={isLoading || !courseAddr}
            className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
          >
            Withdraw ETH
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-4 text-xs px-3 py-2 rounded-lg border ${
          message.startsWith('Error')
            ? 'text-red-400 bg-red-400/10 border-red-400/30'
            : 'text-green-400 bg-green-400/10 border-green-400/30'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default CourseAdminPanel;
