import React, { useState, useCallback } from 'react';
import SkincareChat from './components/SkincareChat';
import DeepAnalysis from './components/DeepAnalysis';
import VideoAnalyzer from './components/VideoAnalyzer';
import { BotIcon, BrainCircuitIcon, VideoIcon } from './components/Icons';

type Mode = 'chat' | 'deep_analysis' | 'video_analysis';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('chat');

  const renderContent = useCallback(() => {
    switch (mode) {
      case 'chat':
        return <SkincareChat />;
      case 'deep_analysis':
        return <DeepAnalysis />;
      case 'video_analysis':
        return <VideoAnalyzer />;
      default:
        return <SkincareChat />;
    }
  }, [mode]);

  const NavButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 dark:focus:ring-offset-gray-800 ${
        active
          ? 'bg-pink-500 text-white shadow-md'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-screen font-sans bg-pink-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md p-4 border-b border-pink-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-pink-600 dark:text-pink-400">
            K-Beauty AI Advisor
          </h1>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your personal AI expert for Korean skincare.
          </p>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto flex flex-col">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 border-t border-pink-200 dark:border-gray-700">
        <div className="max-w-md mx-auto flex items-center justify-around gap-2">
          <NavButton active={mode === 'chat'} onClick={() => setMode('chat')}>
            <BotIcon className="w-5 h-5 mr-2" />
            Chat
          </NavButton>
          <NavButton active={mode === 'deep_analysis'} onClick={() => setMode('deep_analysis')}>
            <BrainCircuitIcon className="w-5 h-5 mr-2" />
            Deep Analysis
          </NavButton>
          <NavButton active={mode === 'video_analysis'} onClick={() => setMode('video_analysis')}>
            <VideoIcon className="w-5 h-5 mr-2" />
            Video Review
          </NavButton>
        </div>
      </footer>
    </div>
  );
};

export default App;
