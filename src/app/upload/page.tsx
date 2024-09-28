'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you're using ShadCN's button component
import { Input } from '@/components/ui/input';   // Assuming there's a styled Input

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
        <Input 
          type="file" 
          onChange={handleFileChange} 
          className="file-input" // Add any necessary ShadCN styling here
        />
        <Button type="submit">
          Upload
        </Button>
      </form>
    </div>
  );
}
