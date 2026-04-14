import React from 'react';
import { Play, Drum, Settings, Music } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
  onPractice: () => void;
  onSettings: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onPractice, onSettings }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 animate-in fade-in duration-500">
      
      {/* Logo Area */}
      <div className="mb-8 md:mb-16 relative flex flex-col items-center">
        {/* Crossed Sticks Graphic (CSS representation) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 h-full w-2 bg-black -translate-x-1/2 rotate-12 rounded-full"></div>
            <div className="absolute top-0 left-1/2 h-full w-2 bg-black -translate-x-1/2 -rotate-12 rounded-full"></div>
        </div>

        <div className="z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-wider text-gray-900 leading-none mb-2">
                JACK <span className="mx-2">/</span> YOUNG
            </h1>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-widest text-gray-900 leading-none">
                DRUMS <span className="mx-2">/</span> TEACHER
            </h2>
        </div>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-5xl px-4 md:px-8 items-stretch justify-center">
        <button 
          onClick={onPlay}
          className="group relative flex-1 flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-white border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-100"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 bg-blue-100 rounded-lg border-2 border-blue-900 text-blue-900 group-hover:bg-blue-200 transition-colors shrink-0">
                <Music size={24} strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
                <span className="block text-xl md:text-2xl font-display font-bold text-gray-900 tracking-wide">PLAY</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider block truncate">Select from Library</span>
            </div>
          </div>
        </button>

        <button 
          onClick={onPractice}
          className="group relative flex-1 flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-white border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-100"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 bg-orange-100 rounded-lg border-2 border-orange-900 text-orange-900 group-hover:bg-orange-200 transition-colors shrink-0">
                <Drum size={24} strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
                <span className="block text-xl md:text-2xl font-display font-bold text-gray-900 tracking-wide">PRACTICE</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider block truncate">Rudiments</span>
            </div>
          </div>
        </button>

        <button 
          onClick={onSettings}
          className="group relative flex-1 flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-white border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-100"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-900 text-gray-900 group-hover:bg-gray-200 transition-colors shrink-0">
                <Settings size={24} strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
                <span className="block text-xl md:text-2xl font-display font-bold text-gray-900 tracking-wide">SETTINGS</span>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider block truncate">Config</span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-12 text-gray-400 text-xs font-mono">
        v1.0.0 • MIDI ENABLED
      </div>
    </div>
  );
};

export default MainMenu;
