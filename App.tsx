
import React, { useState, useEffect } from 'react';
import { GameState, Song } from './types';
import { midiService } from './services/midiService';
import { getLibrary, saveCustomSong } from './services/songLibrary';
import { importMidiSong } from './services/midiImportService';
import Stage from './components/Stage';
import SongLibrary from './components/SongLibrary';
import MainMenu from './components/MainMenu';
import SettingsScreen from './components/SettingsScreen';
import PracticeRoom from './components/PracticeRoom';
import { Music, Zap, Settings, AlertTriangle, X, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'MENU' | 'LIBRARY' | 'STAGE' | 'PRACTICE' | 'SETTINGS'>('MENU');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [midiCheckDone, setMidiCheckDone] = useState(false);
  const [library, setLibrary] = useState<Song[]>(getLibrary());
  const [dismissWarning, setDismissWarning] = useState(false);

  useEffect(() => {
    midiService.initialize().then((success) => {
      setMidiEnabled(success);
      setMidiCheckDone(true);
    });
  }, []);

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setScreen('STAGE');
  };

  const handleExitStage = () => {
    setScreen('LIBRARY');
    setCurrentSong(null);
  };

  const handleImportSong = async (file: File, category?: string) => {
    try {
      const newSong = await importMidiSong(file, category);
      saveCustomSong(newSong);
      setLibrary(prev => [...prev, newSong]);
      // Optional: Automatically select the new song
      // handleSelectSong(newSong); 
    } catch (error) {
      console.error("Failed to import MIDI:", error);
      alert("Failed to parse MIDI file. Please ensure it is a valid .mid file.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Header - Only show when NOT in Menu and NOT in Stage (Stage has its own UI) */}
      {screen !== 'MENU' && screen !== 'STAGE' && (
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-30">
            <div className="flex items-center gap-4">
            {/* Back to Menu Button (if not in Stage, as Stage has its own exit) */}
            {screen !== 'STAGE' && (
                <button 
                    onClick={() => setScreen('MENU')}
                    className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    title="Back to Main Menu"
                >
                    <ArrowLeft size={20} />
                </button>
            )}

            {/* Logo - Assuming logo.png is present in root or user replaces src */}
            <div className="flex items-center gap-2">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-1shvJqvTz3lDgk7yL3Xn5D1g9v7q-z-gA&s" alt="Jack Young Drums" className="h-12 w-auto object-contain" onError={(e) => {
                    // Fallback if image fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }} />
                <h1 className="hidden text-3xl font-display font-bold tracking-tight text-gray-900 leading-none">JACK YOUNG DRUMS</h1>
            </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 border ${midiEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${midiEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {midiEnabled ? (midiService.connectedDeviceName || 'MIDI READY') : 'NO MIDI DEVICE'}
                </div>
            </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        
        {/* MIDI Warning Banner - Show everywhere except Menu (or maybe show everywhere?) */}
        {/* Let's show it everywhere for visibility, or maybe hide on Menu for cleanliness? */}
        {/* I'll hide it on Menu to keep it clean, as Menu has "MIDI ENABLED" text */}
        {screen !== 'MENU' && midiCheckDone && !midiEnabled && !dismissWarning && (
            <div className="bg-orange-50 border-b border-orange-100 p-4 relative animate-in fade-in slide-in-from-top-2 duration-300 z-40">
                <div className="max-w-5xl mx-auto flex items-start gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 mt-1 shadow-sm">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wide mb-1">MIDI Connection Not Detected</h3>
                        <p className="text-sm text-orange-800 leading-relaxed max-w-2xl">
                            To get the most out of this app, connect your electronic drum kit via USB or MIDI. 
                            If you have already connected it, please ensure you have granted <strong>MIDI Permissions</strong> in your browser settings.
                        </p>
                        <div className="mt-3 flex gap-4 items-center">
                            <button 
                                onClick={() => {
                                    setMidiCheckDone(false); // Reset check state
                                    midiService.initialize().then(s => {
                                        setMidiEnabled(s);
                                        setMidiCheckDone(true);
                                    });
                                }}
                                className="text-xs font-bold bg-orange-200 text-orange-900 px-3 py-1.5 rounded hover:bg-orange-300 transition-colors uppercase tracking-wide border border-orange-300 shadow-sm"
                            >
                                Retry Connection
                            </button>
                            <a href="https://support.google.com/chrome/answer/114662?hl=en" target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-700 underline underline-offset-2 py-1.5 hover:text-orange-900">
                                How to enable MIDI?
                            </a>
                        </div>
                    </div>
                    <button onClick={() => setDismissWarning(true)} className="text-orange-400 hover:text-orange-600 p-1 rounded-md hover:bg-orange-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
        )}

        {screen === 'MENU' && (
            <MainMenu 
                onPlay={() => setScreen('LIBRARY')}
                onPractice={() => setScreen('PRACTICE')}
                onSettings={() => setScreen('SETTINGS')}
            />
        )}

        {screen === 'LIBRARY' && (
           <SongLibrary 
              songs={library} 
              onSelectSong={handleSelectSong} 
              onImportSong={handleImportSong}
              onBack={() => setScreen('MENU')}
           />
        )}

        {screen === 'PRACTICE' && (
            <PracticeRoom 
                songs={library}
                onSelectSong={handleSelectSong}
                onImportSong={handleImportSong}
                onBack={() => setScreen('MENU')} 
            />
        )}

        {screen === 'SETTINGS' && (
            <SettingsScreen onBack={() => setScreen('MENU')} />
        )}

        {screen === 'STAGE' && currentSong && (
            <Stage 
                song={currentSong} 
                onExit={handleExitStage}
            />
        )}
      </main>
    </div>
  );
};

export default App;
