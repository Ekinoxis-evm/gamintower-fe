import React from 'react';
import { formatEther } from 'viem';
import { CourseInfo } from '../../types/index';

interface CourseCardProps {
  course: CourseInfo;
  onMint: (course: CourseInfo) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onMint }) => {
  const supplyPct = course.maxSupply > BigInt(0)
    ? Number((course.totalSupply * BigInt(100)) / course.maxSupply)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="mb-3">
        <h3 className="text-white font-bold text-base">{course.name || 'Unnamed Course'}</h3>
        <p className="text-gray-500 text-xs font-mono">{course.symbol}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-cyan-400 font-semibold">{formatEther(course.mintPrice)} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Supply</span>
          <span className="text-white">
            {course.totalSupply.toString()} / {course.maxSupply.toString()}
          </span>
        </div>
        {/* Supply bar */}
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all"
            style={{ width: `${Math.min(supplyPct, 100)}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => onMint(course)}
        disabled={!course.canMint}
        className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all"
      >
        {!course.canMint ? 'Sold Out' : 'Mint'}
      </button>
    </div>
  );
};

export default CourseCard;
