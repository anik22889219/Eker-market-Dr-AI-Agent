import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { VideoIcon } from './Icons';

const MAX_FRAMES = 16;
const FRAME_CAPTURE_INTERVAL_MS = 500; // Capture a frame every 0.5 seconds

const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('এই ভিডিওতে আমার স্কিনকেয়ার রুটিন বিশ্লেষণ করুন। আমি কী সঠিক করছি এবং কী উন্নত করতে পারি?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setResponse('');
      setError('');
    } else {
      setVideoFile(null);
      setVideoPreview(null);
      setError('অনুগ্রহ করে একটি সঠিক ভিডিও ফাইল নির্বাচন করুন।');
    }
  };

  const captureFrames = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current || !videoFile) {
        return reject('ভিডিও বা ক্যানভাস উপাদান প্রস্তুত নয়।');
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return reject('ক্যানভাস কনটেক্সট পাওয়া যায়নি।');

      const frames: string[] = [];
      video.currentTime = 0;

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        const interval = duration > (MAX_FRAMES * FRAME_CAPTURE_INTERVAL_MS / 1000)
            ? duration / MAX_FRAMES
            : FRAME_CAPTURE_INTERVAL_MS / 1000;
        
        let capturedFrames = 0;

        const doCaptureFrame = () => {
          if (capturedFrames >= MAX_FRAMES || video.currentTime >= duration) {
            resolve(frames);
            return;
          }
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl.split(',')[1]); // remove prefix
          
          capturedFrames++;
          setStatus(`ভিডিও প্রসেস করা হচ্ছে... ${MAX_FRAMES} ফ্রেমের মধ্যে ${capturedFrames}টি ক্যাপচার করা হয়েছে।`);
          
          video.currentTime += interval;
        };

        video.addEventListener('seeked', doCaptureFrame);
        doCaptureFrame();
      };
      
      video.onerror = () => reject('ভিডিও ডেটা লোড করতে সমস্যা হয়েছে।');
      video.load();
    });
  };

  const handleAnalyze = async () => {
    if (!videoFile || !prompt.trim()) {
      setError('অনুগ্রহ করে একটি ভিডিও আপলোড করুন এবং একটি প্রশ্ন লিখুন।');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');
    setStatus('ভিডিও বিশ্লেষণের জন্য প্রস্তুত করা হচ্ছে...');

    try {
      const frames = await captureFrames();
      setStatus('ফ্রেমগুলি বিশ্লেষণের জন্য AI-এর কাছে পাঠানো হচ্ছে...');
      const result = await analyzeVideo(prompt, frames);
      setResponse(result);
      setStatus('বিশ্লেষণ সম্পন্ন!');
    } catch (err) {
      console.error(err);
      setError('ভিডিও বিশ্লেষণের সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-yellow-50 dark:bg-gray-800/50">
      <div className="text-center mb-6">
        <VideoIcon className="w-12 h-12 mx-auto text-green-600" />
        <h2 className="text-xl font-bold mt-2 text-green-800 dark:text-green-300">ভিডিও রুটিন অ্যানালাইজার</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          বিশেষজ্ঞদের মতামত পেতে আপনার স্কিনকেয়ার রুটিনের একটি ভিডিও আপলোড করুন।
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="video-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ভিডিও আপলোড করুন</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 dark:file:bg-green-800 dark:file:text-green-200 dark:hover:file:bg-green-700"
            disabled={isLoading}
          />
        </div>

        {videoPreview && (
          <video ref={videoRef} src={videoPreview} className="w-full rounded-lg max-h-48" controls playsInline muted />
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="আপনার বিশ্লেষণের জন্য এখানে লিখুন..."
          className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition"
          rows={3}
          disabled={isLoading}
        />

        <button
          onClick={handleAnalyze}
          disabled={isLoading || !videoFile}
          className="w-full flex justify-center items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              {status || 'বিশ্লেষণ চলছে...'}
            </>
          ) : (
            'ভিডিও বিশ্লেষণ করুন'
          )}
        </button>

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      </div>

      <div className="flex-1 mt-4 overflow-y-auto bg-white dark:bg-gray-700 rounded-lg shadow-inner p-4 border border-gray-200 dark:border-gray-600">
        {response ? (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }}
          />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            আপনার ভিডিও বিশ্লেষণ এখানে প্রদর্শিত হবে।
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalyzer;