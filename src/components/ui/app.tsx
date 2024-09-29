// App.js

import React, { useEffect, useState } from 'react';
import CourseCard from "./course-card";
import coursesData from "../../../courses.json";

// Define the Course interface
interface Course {
  courseCode: string;
  courseName: string;
  medianGrade: string;
  workload: string;
  description: string;
}

const App = () => {
  // Specify that courses is an array of Course objects
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setCourses(coursesData);
  }, []);

  return (
    <div>
      {courses.map(course => (
        <CourseCard 
          key={course.courseCode}
          courseCode={course.courseCode} 
          courseName={course.courseName} 
          medianGrade={course.medianGrade} 
          workload={course.workload} 
          description={course.description} 
        />
      ))}
    </div>
  );
};

export default App;
