import React, { useState } from 'react';
import { useAllCourses } from '../../hooks/courses/useAllCourses';
import { useCourseDetails } from '../../hooks/courses/useCourseDetails';
import { CourseInfo } from '../../types/index';
import CourseCard from './CourseCard';
import MintCourseModal from './MintCourseModal';

interface CourseListProps {
  chainId: number;
}

const CourseList: React.FC<CourseListProps> = ({ chainId }) => {
  const { data: courseAddresses = [], isLoading: loadingAddresses } = useAllCourses(chainId);
  const { data: courses = [], isLoading: loadingDetails } = useCourseDetails(courseAddresses, chainId);
  const [mintCourse, setMintCourse] = useState<CourseInfo | null>(null);

  const isLoading = loadingAddresses || loadingDetails;

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Courses</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-gray-400">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.address}
              course={course}
              onMint={setMintCourse}
            />
          ))}
        </div>
      )}

      {mintCourse && (
        <MintCourseModal
          course={mintCourse}
          chainId={chainId}
          onClose={() => setMintCourse(null)}
          onSuccess={() => setMintCourse(null)}
        />
      )}
    </div>
  );
};

export default CourseList;
