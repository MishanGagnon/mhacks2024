'use client';
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { LoadingSpinner } from '../components/ui/spinner';
import FileUpload from '@/components/ui/FileUpload';
import Chat from "@/components/ui/Chat";
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { div } from "framer-motion/client";

export default function Home() {
  const [uuid, setUUID] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState<boolean>(true);

  useEffect(() => {
    const storedUUID = localStorage.getItem('uuid');
    if (storedUUID) {
      setUUID(storedUUID);
      checkUUID(storedUUID);
    } else {
      const newUUID = uuidv4();
      localStorage.setItem('uuid', newUUID);
      setUUID(newUUID);
      checkUUID(newUUID);
    }
  }, []);

  const checkUUID = async (uuid: string) => {
    console.log("The uuid is: ", uuid);
    try {
      const response = await fetch(`/api/getData?uuid=${encodeURIComponent(uuid)}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        console.log("The data from the API call to getData is: ", data);
        setExists(data.exists);
      } else {
        console.log("Something went wrong: getData call in home page.tsx");
      }
    } catch (error) {
      console.error('Error with GET request in checkUUID', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFocus = () => {
    setFocused(prevFocused => !prevFocused);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-gray-100 dark:bg-zinc-900">
      <LoadingSpinner className="h-16 w-16" />
    </div>
    
    )
  }

  if (exists) {

    if (focused) {
      return (
        
          <div className="w-full h-screen relative bg-gray-100 dark:bg-zinc-900">
      {/* Absolutely Positioned Button */}

      {/* Chat Component */}
      <button className="absolute text-black sm:top-6 sm:left-6 md:top-8 md:left-8 z-50 shadow-lg bg-white hover:bg-gray-200 px-4 py-2 rounded" onClick={handleToggleFocus}>
Upload New Audit</button>
      <Chat />
    </div>

      )
    }
    else {
      return (
        <div className="h-5/6">
          <div className="flex flex-row h-5/6">
            <div className="border-r-2 border-black-500 w-3/6">
              <FileUpload onComplete={() => handleToggleFocus} doCheckCache={false} />
            </div>
            <div className="w-3/6" onFocus={handleToggleFocus}>
              <Chat />
            </div>
          </div>
        </div>
      );
    }

  } else {
    return (
      <div className="">
        <FileUpload onComplete={() => setExists(true)} doCheckCache={true} />
      </div>
    );
  }
}
