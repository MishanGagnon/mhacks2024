'use client'
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { LoadingSpinner } from '../components/ui/spinner';
import FileUpload from '@/components/ui/FileUpload'

export default function Home() {
  const [uuid, setUUID] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <LoadingSpinner className="mr-2 h-4 w-4" />;
  }
  if(exists){
    return <div className="flex flex-row">
        <FileUpload doCheckCache={false}/>
        <div>CHAT INTERFACE</div>
    </div>
  }else{
    return <div>
        <FileUpload doCheckCache = {true}/>
    </div>
  }
}