
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { FileAudioIcon, MicIcon } from './Icons';
import { Feedback } from './Feedback';

const AudioTranscriber: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      // Clear recording if file is selected
      setRecordedBlob(null);
      setRecordedUrl(null);
      setResponse('');
      setError('');
    } else {
      setAudioFile(null);
      setError('অনুগ্রহ করে একটি সঠিক অডিও ফাইল নির্বাচন করুন (mp3, wav, etc.)।');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setAudioFile(null); // Clear file upload if recording is made
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
      setResponse('');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('মাইক্রোফোন অ্যাক্সেস করা যাচ্ছে না। আপনার ব্রাউজারের সেটিংস চেক করুন।');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    const fileToTranscribe = audioFile || recordedBlob;

    if (!fileToTranscribe) {
      setError('অনুগ্রহ করে একটি অডিও ফাইল আপলোড করুন অথবা রেকর্ড করুন।');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const base64 = await fileToBase64(fileToTranscribe);
      // For recorded blobs (usually webm), we can rely on the browser's type or default to something gemini handles if needed,
      // but usually passing the correct mimeType from the blob is best.
      const mimeType = fileToTranscribe.type || 'audio/webm';
      
      const result = await transcribeAudio(base64, mimeType);
      setResponse(result);
    } catch (err) {
      console.error(err);
      setError('ট্রান্সক্রিপশনের সময় একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-yellow-50 dark:bg-gray-800/50">
      <div className="text-center mb-6">
        <FileAudioIcon className="w-12 h-12 mx-auto text-green-600" />
        <h2 className="text-xl font-bold mt-2 text-green-800 dark:text-green-300">অডিও ট্রান্সক্রাইবার</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ভয়েস নোট বা রেকর্ডিং আপলোড করুন, আমরা তা টেক্সটে রূপান্তর করব।
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* File Upload Section */}
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">অডিও ফাইল আপলোড করুন</label>
            <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 dark:file:bg-green-800 dark:file:text-green-200 dark:hover:file:bg-green-700 cursor-pointer"
                disabled={isLoading || isRecording}
            />
            {audioFile && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <span className="font-medium">নির্বাচিত ফাইল:</span> <span className="ml-1 truncate">{audioFile.name}</span>
                </div>
            )}
        </div>

        <div className="flex items-center justify-center">
            <div className="h-px bg-gray-300 dark:bg-gray-600 w-full"></div>
            <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">অথবা</span>
            <div className="h-px bg-gray-300 dark:bg-gray-600 w-full"></div>
        </div>

        {/* Recording Section */}
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-600 flex flex-col items-center justify-center text-center">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">সরাসরি রেকর্ড করুন</label>
             
             {!isRecording ? (
                 <button 
                    onClick={startRecording}
                    disabled={isLoading || !!audioFile} // Disable if file is uploaded
                    className={`rounded-full p-4 transition-all duration-300 ${
                        audioFile ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200 hover:scale-110'
                    }`}
                    title="রেকর্ডিং শুরু করুন"
                 >
                    <MicIcon className="w-8 h-8" />
                 </button>
             ) : (
                 <div className="flex flex-col items-center">
                     <div className="animate-pulse text-red-600 font-semibold mb-2">রেকর্ডিং চলছে...</div>
                     <button 
                        onClick={stopRecording}
                        className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                     >
                        থামুন
                     </button>
                 </div>
             )}

             {recordedUrl && !isRecording && (
                 <div className="mt-4 w-full">
                     <audio controls src={recordedUrl} className="w-full h-10" />
                     <button 
                        onClick={() => {
                            setRecordedBlob(null);
                            setRecordedUrl(null);
                        }}
                        className="mt-2 text-xs text-red-500 hover:underline"
                     >
                        মুছে ফেলুন
                     </button>
                 </div>
             )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleTranscribe}
          disabled={isLoading || (!audioFile && !recordedBlob)}
          className="w-full flex justify-center items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 mt-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              ট্রান্সক্রাইব করা হচ্ছে...
            </>
          ) : (
            'ট্রান্সক্রাইব করুন'
          )}
        </button>

        {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
      </div>

      {/* Result Section */}
      <div className="flex-1 mt-6 overflow-y-auto bg-white dark:bg-gray-700 rounded-lg shadow-inner p-4 border border-gray-200 dark:border-gray-600">
        {response ? (
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-300">ফলাফল:</h3>
            <div dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }} />
            <Feedback />
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center">
            <p>আপনার ট্রান্সক্রিপশন এবং সারাংশ এখানে প্রদর্শিত হবে।</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;