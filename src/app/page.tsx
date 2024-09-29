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
  const [focused, setFocused] = useState<boolean>(false);

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
    return <LoadingSpinner className="mr-2 h-4 w-4" />;
  }

  if (exists) {

    if (focused) {
      return (
        <div className="">
          <div className="w-full">
            <Button
              onClick={handleToggleFocus}
              variant="contained"
              startIcon={<ArrowBackIcon />}
              sx={{ backgroundColor: 'white', color: 'black', '&:hover': { backgroundColor: 'darkgrey' } }}
              size="medium"
            >
            </Button>
            <Chat />
          </div>

        </div >
      )
    }
    else {
      return (
        <div className="h-5/6">
          <div className="flex flex-row h-5/6">
            <div className="border-r-2 border-black-500 w-3/6">
              <FileUpload onComplete={() => setExists(true)} doCheckCache={false} />
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
