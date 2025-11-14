import React, { useState, useCallback } from 'react';
import SkincareChat from './components/SkincareChat';
import DeepAnalysis from './components/DeepAnalysis';
import VideoAnalyzer from './components/VideoAnalyzer';
import { BotIcon, BrainCircuitIcon, VideoIcon } from './components/Icons';

type Mode = 'chat' | 'deep_analysis' | 'video_analysis';

const EKER_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGgAAP+lSURBVHhe7J0FnB1Vt+b/5yZpvUkaDQm9N0gISQgBCSGEEGigoBAQEBUFRUWwsCIiAqgoKPbAsoKKIoiIgKAgiB7SIQi9EUi9SYKk95JkMvn7M/eee++9e1tCEhK++fm4b9/M/GbmzJyZ+c18M2fOjBghQoQIQVdK+f3//3+ysLCwV3UJEZ8bLVq0sE6dOhzOnDnT0uX81KlTxbt27eL+/fsVXV1d1apVfX39YmJi1qxZs2bNmjVz5syZM2eamZlZWlpaWlpaWlpa+vDhg9+vWbPmsWPH6urqcnJycnJyKisrq6urY8eOJSUlJSYmJiYmZmRkZGdnZ2VlZWdnx8bGxsbG5ubm5ubmpqamtra2pqampaWlpaWl5eXl5eXllZWVlZWVlZWVtbW1tbW1ubm5ubm5ublZWVkZGRkZGRkZGRkZGRnZ2dnx8fHx8fHx8fFxcnJycnJycnJycXFxcnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnouborp...AASUVORK5CYII=";

// FIX: Moved NavButton outside of App component to avoid re-creation on every render.
// This is a React best practice that improves performance and prevents potential bugs.
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
    className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 ${
      active
        ? 'bg-green-600 text-white shadow-md'
        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

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

  return (
    <div className="flex flex-col h-screen font-sans bg-yellow-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md p-2 border-b border-green-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
            <img src={EKER_LOGO_BASE64} alt="Eker Skincare Logo" className="h-16" />
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto flex flex-col">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 border-t border-green-200 dark:border-gray-700">
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
