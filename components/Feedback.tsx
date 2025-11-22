import React, { useState } from 'react';
import { ThumbUpIcon, ThumbDownIcon } from './Icons';

export const Feedback: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'liked' | 'disliked'>('idle');

  if (status !== 'idle') {
    return (
      <div className="text-xs text-gray-500 mt-2 italic animate-fade-in">
        মতামতের জন্য ধন্যবাদ! {status === 'liked' ? '💚' : ''}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
      <span className="text-xs text-gray-400">তথ্যটি কি সহায়ক ছিল?</span>
      <button 
        onClick={() => setStatus('liked')} 
        className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
        title="হ্যাঁ"
      >
        <ThumbUpIcon className="w-4 h-4" />
      </button>
      <button 
        onClick={() => setStatus('disliked')} 
        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
        title="না"
      >
        <ThumbDownIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
