
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useActions } from "ai/rsc";
import { getAIState } from "ai/rsc";
import { useAIState } from 'ai/rsc';

import { Message } from "@/components/ui/message";
import { useScrollToBottom } from "@/components/ui/use-scroll-to-bottom";
import { motion } from "framer-motion";
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { h1 } from "framer-motion/client";
import { AI } from "@/app/actions";
import { CoreMessage } from "ai";
interface Course {
  id: string;
  user_id: string;
  course_code: string;
  course_name: string;
  semester_year: string;
  grade: string;
  credits: number;
  completion: string
  file_name: string
  // Add other relevant fields
}import { searchPlaceholders } from './promptList'

export default function DarkThemedChat() {
  const { sendMessage } = useActions();



  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    { title: "Show me a class", label: "What is EECS 370?", action: "What is EECS 370?" },
    { title: "Compare classes", label: "Compare EECS 183 with EECS 110", action: "Compare EECS 183 with EECS 110" },
    {
      title: "Scatter plot course info",
      label: "Give me a scatter plot for desire to take and understanding for 10 EECS classes",
      action: "Give me a scatter plot for 10 EECS classes between the metrics Desire to Take and Understanding ",
    },
    {
      title: "Ask for personal suggestions",
      label: "Should I take EECS 370 next semester?",
      action: "Should I take EECS 370 next semester?",
    },
  ];
  const [AuditData, setAuditData] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useAIState();
  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * searchPlaceholders.length);
    // Return the item at that index
    return searchPlaceholders[randomIndex];
  }

  useEffect(()=>{
    // console.log(getAIState('context'))
    // const test = async ()=> {
      

    if(AuditData){
      let string = AuditData.map(course => {
        return `Course: ${course.course_code} - ${course.course_name}, Semester: ${course.semester_year}, Grade: ${course.grade}, Credits: ${course.credits}, Completion: ${course.completion}`;
      }).join('\n')
      
      setContext((prevContext : any) => ({
        ...prevContext,
        context: string
      }));  
    }
  },[AuditData])

  useEffect(() => {
    
    const fetchAuditData = async () => {
      try {
        // Retrieve UUID from localStorage
        const uuid = localStorage.getItem('uuid');

        if (!uuid) {
          setError('UUID not found in localStorage.');
          setLoading(false);
          return;
        }

        // Make the POST request to the API endpoint
        const response = await fetch(`/api/getContext?uuid=${encodeURIComponent(uuid)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Handle HTTP errors
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit data.');
        }

        // Parse the JSON response
        const data: Course[] = await response.json();
        setAuditData(data); // Assuming UUID is unique and returns a single course

        if (data.length === 0) {
          setError('No course found with the provided UUID.');
        } else {
          console.log(AuditData,'audit')

        }
      } catch (err: any) {
        // Handle network or parsing errors
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, []);

  
  if(loading){
    <h1>Loading course data</h1>
  }


  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-black text-zinc-100">
      <div className="flex flex-col justify-between gap-4 w-full max-w-3xl">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-3 mt-10  h-full w-full items-center overflow-y-scroll"
        >
          {messages.length === 0 && (
            <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
              <div className="border border-zinc-700 rounded-lg p-6 flex flex-col gap-4 text-zinc-100">
                <p className="flex flex-row justify-center gap-4 items-center text-zinc-100 text-2xl font-bold">
                  <PersonAddAlt1RoundedIcon />
                  {/* UMazing */}
                </p>
                <p>
                  Ask the course assistant about any courses that you are looking to take in the future and any
                  other queries you have regarding course description and scheduling. The course assistant is able
                  to apply genUI when comparing classes, talking about a specific class, and even a timeline
                  for scheduling classes for future semesters. Try it out with some of the suggested prompts below!
                </p>
              </div>
            </motion.div>
          )}
          {messages.map((message) => message)}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px] mb-4">
          {messages.length === 0 &&
            suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.01 * index }}
                key={index}
                className={index > 1 ? "hidden sm:block" : "block"}
              >
                <button
                  onClick={async () => {
                    setMessages((messages) => [
                      ...messages,
                      <Message
                        key={messages.length}
                        role="user"
                        content={action.action}
                      />,
                    ]);
                    const response: ReactNode = await sendMessage(
                      action.action,
                    );
                    setMessages((messages) => [...messages, response]);
                  }}
                  className="w-full text-left border border-zinc-200  rounded-lg p-2 text-sm hover:bg-zinc-700 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium ">{action.title}</span>
                  <span className="text-zinc-400">
                    {action.label}
                  </span>
                </button>
              </motion.div>
            ))}
        </div>

          <form
            className="flex flex-col gap-2 relative items-center"
            onSubmit={async (event) => {
              event.preventDefault();

              setMessages((messages) => [
                ...messages,
                <Message key={messages.length} role="user" content={input} />,
              ]);
              setInput("");

              const response: ReactNode = await sendMessage(input);
              setMessages((messages) => [...messages, response]);
            }}
          >
            <input
              ref={inputRef}
              className="bg-zinc-800 rounded-md px-2 py-1.5 w-full outline-none text-zinc-100 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
              placeholder={getRandomPlaceholder()}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
          </form>
        </div>
      </div>
    );
  }