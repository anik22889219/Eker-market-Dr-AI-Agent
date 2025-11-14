import React, { useState } from 'react';
import { deepAnalyze } from '../services/geminiService';
import { BrainCircuitIcon } from './Icons';

const DeepAnalysis: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('গভীর বিশ্লেষণের জন্য অনুগ্রহ করে একটি প্রশ্ন লিখুন।');
      return;
    }
    setIsLoading(true);
    setError('');
    setResponse('');
    try {
      const result = await deepAnalyze(query);
      setResponse(result);
    } catch (err) {
      setError('বিশ্লেষণের সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-yellow-50 dark:bg-gray-800/50">
      <div className="text-center mb-6">
        <BrainCircuitIcon className="w-12 h-12 mx-auto text-green-600" />
        <h2 className="text-xl font-bold mt-2 text-green-800 dark:text-green-300">গভীর স্কিনকেয়ার বিশ্লেষণ</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          বিশেষজ্ঞ-স্তরের প্রতিক্রিয়ার জন্য জটিল প্রশ্ন জিজ্ঞাসা করুন।
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="যেমন, রেটিনয়েড কীভাবে কেরাটিনোসাইট পৃথকীকরণে প্রভাব ফেলে এবং সেলুলার রেটিনোইক অ্যাসিড-বাইন্ডিং প্রোটিন (CRABPs)-এর ভূমিকা কী, তার আণবিক প্রক্রিয়া ব্যাখ্যা করুন..."
          className="w-full h-40 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full flex justify-center items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              বিশ্লেষণ চলছে...
            </>
          ) : (
            'গভীর বিশ্লেষণ পান'
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
            আপনার বিস্তারিত বিশ্লেষণ এখানে প্রদর্শিত হবে।
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepAnalysis;