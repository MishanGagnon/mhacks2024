import { Message, TextStreamMessage } from "@/components/ui/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
import Fuse from 'fuse.js';

import {
  createAI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
//import coursesData from '@/courses.json'; // Adjust the path as necessary
import coursesData from '@/../test.json';
import CourseCard from '@/components/ui/course-card';
import { div } from "framer-motion/client";
import Markdown from "react-markdown";
import { CourseCardProps } from "@/components/ui/course-card";
import MetricBarChart from "@/components/ui/bar-chart";


const choppedData  = coursesData.slice(0,coursesData.length)
const sendMessage = async (message: string) => {
  "use server"
  const messages = getMutableAIState<typeof AI>("messages");
  const context = getAIState<typeof AI>("context");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;
  const options = {
    keys: ['course_code'], // Specify the keys to search in
    threshold: 0.3,        // Adjust the threshold for fuzzy matching (0.0 = exact match, 1.0 = match anything)
  };
  
  // Initialize Fuse with your data and options
  const fuse = new Fuse(choppedData, options);
  let string = choppedData.map(course => {
    return `Course: ${course.course_code}, Title ${course.title}, Description: ${course.description}, Workload: ${course.Workload}%, Increase Interest: ${course.Increased_Interest}, Credits : ${course.max_credits}, Desire to Take: ${course.Desire_to_take}% Enforced Prerecs: ${course.enforced_prereqs}`;
  }).join('\n')
  const { value: stream } = await streamUI({
    model: openai("gpt-4o-mini"),
    
    system: `\
      - ${context}
      - you are a friendly course guide and scheduling assistant
      - This is background info on classes: ${string}
      - advise students on what class to take based on context. Do not consider personal interests and career goals
      - you must follow the guidelines given by the tool descriptions, failing to use the right tool would be bad
    `,
    
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    tools: {
      compareCourses: {
        description: "This tool compares two courses by giving details about both. if the word COMPARE is used this tool is the best option. ",
        parameters: z.object({
          courseCodeForMostRecentlyMentionedCourse: z.string(),
          courseCodeForSecondMostRecentlyMentionedCourse: z.string(),
        }),
        generate: async function* ({ courseCodeForMostRecentlyMentionedCourse, courseCodeForSecondMostRecentlyMentionedCourse }) {
          const toolCallId = generateId();
      
          // Find course data for both course codes
          const searchString1 = courseCodeForMostRecentlyMentionedCourse;
          const searchString2 = courseCodeForSecondMostRecentlyMentionedCourse;

          // Perform fuzzy search
          const result1 = fuse.search(searchString1);
          const result2 = fuse.search(searchString2);

          const course1 = result1.length > 0 ? result1[0].item : null;
          const course2 = result2.length > 0 ? result2[0].item : null;
          
          if (!course1 || !course2) {
            return (
              <Message role="assistant" content={<p>I'm not exactly sure which course you're referring to, can you specify.</p>} />
            );
          }
          const comparisonPrompt = `Compare the following courses:
          ${course1.title} ${course1.course_code} - ${course1.description}
          ${course2.title} ${course2.course_code} - ${course2.description}
      
          What class should the student take? pick one and be decisive.`;

          // Call the AI model for a summary comparison
          const { value: comparisonSummary } = await streamUI({
          model: openai("gpt-4o-mini"),
          
          messages: [
          {
            role: "user",
            content: comparisonPrompt,
          },
          ],
          });
      
          // Create course card components
          const courseCard1 = (
            // <CourseCard 
            //   courseCode={course1.course_code} 
            //   courseName={course1.courseName} 
            //   medianGrade={course1.medianGrade} 
            //   workload={course1.workload} 
            //   description={course1.description} 
            // />
            <CourseCard 
            course = {course1}
          />
          );
      
          const courseCard2 = (
            <CourseCard 
              course = {course2}
            />
          );
          const courseCardString1 = `
          Course Code: ${course1.course_code}
          Course Name: ${course1.title}
          
          Workload: ${course1.Workload}
          Description: ${course1.description}
          `
            const courseCardString2 = `
          Course Code: ${course2.course_code}
          Course Name: ${course2.title}
          
          Workload: ${course2.Workload}
          Description: ${course2.description}
          `
          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "compareCourses",
                  args: { courseCodeForMostRecentlyMentionedCourse, courseCodeForSecondMostRecentlyMentionedCourse },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "compareCourses",
                  toolCallId,
                  result: `${courseCardString1} ${courseCardString2} ${comparisonSummary}`,
                },
              ],
            },
          ]);
      
          return (
            <Message role="assistant" content={
              <>
                <div className="flex justify-between">
                  <div className="w-1/2 pr-2">
                    {courseCard1}
                  </div>
                  <div className="w-1/2 pl-2">
                    {courseCard2}
                  </div>
                </div>

                <p className="mt-4">{comparisonSummary}</p>
              </>
            } />
          );          
        },
      },
      getMetricsBarChart: {
        description: "Return a bar chart for course statistics like Workload, Increased Interest, Desire to take, Understanding, and Expectations",
        parameters: z.object({
          courseCodes: z.array(z.string()), // Accept an array of course codes for comparison
          metricType: z.enum(['Workload', 'Increased Interest', 'Desire_to_take', 'Understanding', 'Expectations']), // Updated metric name
        }),
        generate: async function* ({ courseCodes, metricType }) {
          const toolCallId = generateId();
      
          // Filter the courses based on the provided courseCodes
          const selectedCourses = choppedData.filter(course => courseCodes.includes(course.course_code));
      
          if (selectedCourses.length === 0) {
            return (
              <Message role="assistant" content={<p>No courses found for the provided codes.</p>} />
            );
          }
      
          // Prepare metrics for the selected metric type
          const metrics = selectedCourses.map(course => {
            const workload = course.Workload ? parseFloat(course.Workload) : 0; // Default to 0 if undefined
            const increasedInterest = course["Increased_Interest"] ? parseFloat(course["Increased_Interest"]) : 0; // Default to 0 if undefined
            const desireToTake = course["Desire_to_take"] ? parseFloat(course["Desire_to_take"]) : 0; // Default to 0 if undefined
            const understanding = course["Understanding"] ? parseFloat(course["Understanding"]) : 0; // Default to 0 if undefined
            const expectations = course["Expectations"] ? parseFloat(course["Expectations"]) : 0; // Default to 0 if undefined
            
            return {
              label: course.course_code, // Use course code as label
              value: metricType === 'Workload' ? workload 
                     : metricType === 'Increased Interest' ? increasedInterest
                     : metricType === 'Desire_to_take' ? desireToTake
                     : metricType === 'Understanding' ? understanding
                     : expectations, // Default to Expectations
            };
          });
      
          // Create MetricBarChart component for the selected metric type
          const barChart = <MetricBarChart metrics={metrics} />;
      
          // Update the messages with the results
          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "getMetricsBarChart",
                  args: { courseCodes, metricType },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "getMetricsBarChart",
                  toolCallId,
                  result: `Here is the bar chart for ${metricType} metrics.`,
                },
              ],
            },
          ]);
      
          return (
            <Message role="assistant" content={
              <>
                <h3>{metricType} Comparison</h3>
                {barChart}
              </>
            } />
          );
        },
      },      
      // getCourseCard: {
      //   description: "If someone asks for details about a single course give use THIS tool",
      //   parameters: z.object({
      //     courseCode: z.string(),
      //   }),
      //   generate: async function* ({ courseCode }) {
      //     const course = choppedData.find(course => course.course_code === courseCode);
      //     const toolCallId = generateId();
          
      //     if (!course) {
      //       return (
      //         <Message role="assistant" content={<p>course not found.</p>} />
      //       );
      //     }
      //     const courseCardString1 = `
      //     Course Code: ${course.course_code}
      //     Course Name: ${course.title}
          
      //     Workload: ${course.Workload}
      //     Description: ${course.description}
      //     `
      //     const cardPrompt = `Give a brief description of this course
      //     ${course.title} ${course.course_code}
      //     `;

      //     // Call the AI model for a summary comparison
      //     const { value: cardSummary } = await streamUI({
      //     model: openai("gpt-4o-mini"),
          
      //     messages: [
      //     {
      //       role: "user",
      //       content: cardPrompt,
      //     },
      //     ],
      //     });

      //     // Create course card components
      //     const courseCard1 = (
      //       <CourseCard 
      //         course = {course}
      //       />
      //     );

      //     messages.done([
      //       ...(messages.get() as CoreMessage[]),
      //       {
      //         role: "assistant",
      //         content: [
      //           {
      //             type: "tool-call",
      //             toolCallId,
      //             toolName: "compareCourses",
      //             args: { courseCode },
      //           },
      //         ],
      //       },
      //       {
      //         role: "tool",
      //         content: [
      //           {
      //             type: "tool-result",
      //             toolName: "compareCourses",
      //             toolCallId,
      //             result: `${courseCardString1}`,
      //           },
      //         ],
      //       },
      //       {
      //         role: "user",
      //         content : cardPrompt
      //       }
      //     ]);

      //     if (course) {
      //       return (<>
      //         <Message role="assistant" content={<CourseCard 
      //           course = {course}
      //         />} />

      //         <Message role="assistant" content={cardSummary} />
      //         </>
      //       );
      //     } else {
      //       return (
      //         <Message role="assistant" content={<p>Course not found.</p>} />
      //       );
      //     }
      //   },
      // },      
    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
  context: string
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
    context: ""
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
