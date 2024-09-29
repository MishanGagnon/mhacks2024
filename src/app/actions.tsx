import { Message, TextStreamMessage } from "@/components/ui/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
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


const choppedData  = coursesData.slice(0,5)
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

  const classContext = `${JSON.stringify(choppedData)} `;
  console.log(context, "CONTEXT")
  const { value: stream } = await streamUI({
    model: openai("gpt-4o-mini"),
    
    system: `\
      - ${context}
      - you are a friendly course guide and scheduling assistant
      - here is some context about classes: ${classContext}
      - advise students on what class to take based on context. Do not consider personal interests and career goals
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
        description: "if the word COMPARE is used use this tool",
        parameters: z.object({
          courseCodeForMostRecentlyMentionedCourse: z.string(),
          courseCodeForSecondMostRecentlyMentionedCourse: z.string(),
        }),
        generate: async function* ({ courseCodeForMostRecentlyMentionedCourse, courseCodeForSecondMostRecentlyMentionedCourse }) {
          const toolCallId = generateId();
      
          // Find course data for both course codes
          const course1 = choppedData.find(course => course.course_code === courseCodeForMostRecentlyMentionedCourse);
          const course2 = choppedData.find(course => course.course_code === courseCodeForSecondMostRecentlyMentionedCourse);
          
          if (!course1 || !course2) {
            return (
              <Message role="assistant" content={<p>One or both courses not found.</p>} />
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
      getCourseCard: {
        description: "If someone asks for details about a single course give use THIS tool",
        parameters: z.object({
          courseCode: z.string(),
        }),
        generate: async function* ({ courseCode }) {
          const course = choppedData.find(course => course.course_code === courseCode);
          const toolCallId = generateId();
          
          if (!course) {
            return (
              <Message role="assistant" content={<p>course not found.</p>} />
            );
          }
          const courseCardString1 = `
          Course Code: ${course.course_code}
          Course Name: ${course.title}
          
          Workload: ${course.Workload}
          Description: ${course.description}
          `
          const cardPrompt = `Give a brief description of this course
          ${course.title} ${course.course_code}
          `;

          // Call the AI model for a summary comparison
          const { value: cardSummary } = await streamUI({
          model: openai("gpt-4o-mini"),
          
          messages: [
          {
            role: "user",
            content: cardPrompt,
          },
          ],
          });

          // Create course card components
          const courseCard1 = (
            <CourseCard 
              course = {course}
            />
          );

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "compareCourses",
                  args: { courseCode },
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
                  result: `${courseCardString1}`,
                },
              ],
            },
            {
              role: "user",
              content : cardPrompt
            }
          ]);

          if (course) {
            return (<>
              <Message role="assistant" content={<CourseCard 
                course = {course}
              />} />

              <Message role="assistant" content={cardSummary} />
              </>
            );
          } else {
            return (
              <Message role="assistant" content={<p>Course not found.</p>} />
            );
          }
        },
      },      
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
