import React from 'react';
import { useCourseContent } from '../../hooks/courses/useCourseContent';

interface CourseContentProps {
  courseAddress: `0x${string}`;
  tokenId: bigint;
  chainId: number;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseAddress, tokenId, chainId }) => {
  const { data: content, isLoading, error } = useCourseContent(courseAddress, tokenId, chainId);

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-48 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-full" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4">
        <p className="text-red-400 text-sm">
          {!content ? 'You do not hold this course NFT.' : 'Failed to load course content.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4">
      <h3 className="text-cyan-400 font-semibold text-sm mb-2">Private Content</h3>
      <p className="text-gray-300 text-sm break-all">{content}</p>
    </div>
  );
};

export default CourseContent;
