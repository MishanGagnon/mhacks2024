// CourseCarousel.tsx
"use client"
import React from 'react';
import Slider from 'react-slick';
import CourseCard, { CourseCardProps } from '@/components/ui/course-card';

interface CourseCarouselProps {
  courses: any[]
}

const CourseCarousel: React.FC<CourseCarouselProps> = ({ courses }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="relative">
      <Slider {...settings} className="p-4">
        {courses.map((course, index) => (
          <div key={index} className="flex justify-center">
            <div className="min-w-[250px] max-w-[250px] transition-transform duration-300 ease-in-out hover:scale-105">
              <CourseCard course={course} />
            </div>
          </div>
        ))}
      </Slider>
      {/* Custom styling for dots */}
      <style jsx>{`
        .slick-dots {
          bottom: 10px;
        }
        .slick-dots li.slick-active button:before {
          color: #1e3a8a; /* Blue color */
        }
        .slick-dots li button:before {
          color: #93c5fd; /* Light blue color */
        }
      `}</style>
    </div>
  );
};

export default CourseCarousel;