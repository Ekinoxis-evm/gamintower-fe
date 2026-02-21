import React, { useState } from 'react';
import { formatEther } from 'viem';
import { CourseInfo } from '../../types/index';
import { useMintCourse } from '../../hooks/courses/useMintCourse';

interface MintCourseModalProps {
  course: CourseInfo;
  chainId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const MintCourseModal: React.FC<MintCourseModalProps> = ({
  course,
  chainId,
  onClose,
  onSuccess,
}) => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mintCourse } = useMintCourse();

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    try {
      await mintCourse({
        courseAddress: course.address,
        mintPrice: course.mintPrice,
        chainId,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Mint Course</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <h3 className="text-white font-bold mb-1">{course.name}</h3>
          <p className="text-gray-500 text-xs mb-3">{course.symbol}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price</span>
            <span className="text-cyan-400 font-bold">{formatEther(course.mintPrice)} ETH</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          You will pay {formatEther(course.mintPrice)} ETH to mint this course NFT and gain access to private content.
        </p>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
        >
          {isMinting ? 'Minting...' : `Mint for ${formatEther(course.mintPrice)} ETH`}
        </button>
      </div>
    </div>
  );
};

export default MintCourseModal;
