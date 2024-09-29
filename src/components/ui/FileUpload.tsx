'use client';

import { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from './spinner';
import { v4 as uuidv4 } from 'uuid';
import { json } from 'node:stream/consumers';

export default function FileUpload({ onComplete, doCheckCache }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [confirm, setConfirm] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uuid, setUUID] = useState<string | null>(null)

    useEffect(() => {
        const storedUUID = localStorage.getItem('uuid');
        if (storedUUID) {
            setUUID(storedUUID);
        } else {
            const newUUID = uuidv4();
            localStorage.setItem('uuid', newUUID);
            setUUID(newUUID);
        }
    }, []);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
        }
    };

    const clearFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFile(null);
        setConfirm(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file) return;

        setIsLoading(true);
        setConfirm(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('uuid', uuid || '');
        formData.append('doCheckCache', JSON.stringify(doCheckCache));

        try {

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setConfirm(true);
            onComplete();
            console.log(data);
        } catch (error) {
            console.log("Error: Problem with uploading file", error);
            setConfirm(false);
        } finally {
            setIsLoading(() => false);
        }

        console.log("This is the form data:", formData)
        console.log("This is the uuid:", uuid)
    };


    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <div className="mb-10">
                <h1 className='text-7xl' style={{ fontFamily: ' , sans-serif' }}>UMazing</h1>
            </div>
            <div className="rounded-3xl bg-gray-100 p-16">
                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
                    <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="file-input"
                        disabled={isLoading}
                    />
                    <div className="mb-2 my-2 h-6"> {/* Fixed height to prevent layout shift */}
                        {confirm === true && <p className="text-green-500">File uploaded successfully!</p>}
                        {confirm === false && <p className="text-red-500">File upload failed. Please try again.</p>}
                    </div>
                    <div className="flex space-x-4">
                        <Button type="submit" disabled={isLoading || !file}>
                            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                            {isLoading ? 'Uploading...' : 'Upload'}
                        </Button>
                        <Button type="button" onClick={clearFile} disabled={isLoading}>
                            Clear File
                        </Button>
                    </div>
                </form>
            </div>
        </div>

    );
}