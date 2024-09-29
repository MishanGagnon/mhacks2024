// CourseCard.tsx
import React from 'react';
import { StringValidation } from 'zod';

// Define the interface for the props
export interface CourseCardProps {
  // courseCode: string;
  // courseName: string;
  // medianGrade: string;
  // workload: string;
  // description: string;
  subject?: string;
  catalog_number?: string;
  course_code?: string;
  course_code_spaced?: string;
  title?: string;
  description?: string;
  enforced_prereqs?: string;
  advisory_prereqs?: string;
  max_credits?: string;
  cross_listed_courses?: string[];
  lsa_details?: string[];
  Workload?: string;
  Expectations?: string;
  Increased_Interest?: string;
}

const CourseCard = (
  // courseCode,
  // courseName,
  // medianGrade,
  // workload,
  // description,
  course : any ) => {
  if(!course.course){
    return <div className="bg-gray-800 text-white rounded-lg shadow-md p-6 m-4 max-w-xs">
      <p>shit</p>
    </div>
  }
  course = course.course
  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-6 m-4 max-w-xs">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{course.course_code_spaced || ""}</h2>
        <h3 className="text-xl text-gray-400">{course.title || ""}</h3>
      </div>
      <div className="mb-4">
        <p><strong>Workload: </strong> {course.Workload || ""}</p>
        <p><strong>Increased Interest in Subject:</strong> {course.Increased_Interest || ""}</p>
        <p><strong>Expectations:</strong> {course.Expectations || ""}</p>
        <p><strong>Desire to take:</strong> {course.Desire_to_take || ""}</p>
        <p><strong>Understanding: </strong> {course.Understanding || ""}</p>
      </div>
      <p className="text-gray-300">{course.description || ""}</p>
    </div>
  );
};

export default CourseCard;
