import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Mic, Keyboard, RefreshCw, Trash2 } from 'lucide-react';
import { getKeyboardMap, saveKeyboardMap, resetKeyboardMap } from '../services/inputService';
import { DrumType } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [keyboardMap, setKeyboardMap] = useState<Record<string, DrumType>>({});
  const [listeningFor, setListeningFor] = useState<DrumType | null>(null);

  useEffect(() => {
    setKeyboardMap(getKeyboardMap());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (listeningFor) {
        e.preventDefault();
        
        // Remove any existing mapping for this key
        const newMap = { ...keyboardMap };
        
        // If this key was already mapped to something else, remove it?
        // Or just overwrite.
        // Also remove if this drum type was mapped to another key? 
        // Let's allow multiple keys for same drum? No, map is Key -> Drum.
        // So one key can only trigger one drum.
        
        // Update map
        newMap[e.key] = listeningFor;
        
        setKeyboardMap(newMap);
        saveKeyboardMap(newMap);
        setListeningFor(null);
      }
    };

    if (listeningFor) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [listeningFor, keyboardMap]);

  const getKeysForDrum = (drum: DrumType) => {
    return Object.entries(keyboardMap)
      .filter(([_, d]) => d === drum)
      .map(([k]) => k === ' ' ? 'Space' : k.toUpperCase());
  };

  const handleReset = () => {
      const defaultMap = resetKeyboardMap();
      setKeyboardMap(defaultMap);
  };

  const drumTypes = [
    { type: DrumType.KICK, label: 'Kick' },
    { type: DrumType.SNARE, label: 'Snare' },
    { type: DrumType.HIHAT_CLOSED, label: 'Hi-Hat Closed' },
    { type: DrumType.HIHAT_OPEN, label: 'Hi-Hat Open' },
    { type: DrumType.CRASH, label: 'Crash' },
    { type: DrumType.RIDE, label: 'Ride' },
    { type: DrumType.TOM1, label: 'Tom 1' },
    { type: DrumType.TOM2, label: 'Tom 2' },
    { type: DrumType.FLOOR_TOM, label: 'Floor Tom' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-4xl font-display font-bold text-gray-900">SETTINGS</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {/* Audio Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 text-gray-900">
              <Volume2 className="text-blue-600" />
              <h2 className="text-xl font-bold">Audio</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Master Volume</label>
                <input type="range" className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metronome Volume</label>
                <input type="range" className="w-full accent-blue-600" />
              </div>
            </div>
          </div>

          {/* MIDI Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 text-gray-900">
              <Mic className="text-orange-600" />
              <h2 className="text-xl font-bold">MIDI Input</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                Current Device: <span className="font-mono font-bold text-gray-900">None Detected</span>
              </div>
              <button className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Refresh Devices
              </button>
            </div>
          </div>

          {/* Keyboard Mapping */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-gray-900">
                    <Keyboard className="text-purple-600" />
                    <h2 className="text-xl font-bold">Keyboard Mapping</h2>
                </div>
                <button 
                    onClick={handleReset}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    <RefreshCw size={12} />
                    RESET DEFAULTS
                </button>
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
              Click a drum pad below, then press any key to map it.
            </p>

            {listeningFor && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm mx-4">
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Keyboard size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Press any key...</h3>
                        <p className="text-gray-500 mb-6">
                            Mapping for <span className="font-bold text-purple-600">{drumTypes.find(d => d.type === listeningFor)?.label}</span>
                        </p>
                        <button 
                            onClick={() => setListeningFor(null)}
                            className="text-sm font-bold text-gray-400 hover:text-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {drumTypes.map((drum) => {
                const keys = getKeysForDrum(drum.type);
                const isListening = listeningFor === drum.type;
                
                return (
                    <div 
                        key={drum.type} 
                        onClick={() => setListeningFor(drum.type)}
                        className={`p-4 border rounded-xl text-center cursor-pointer transition-all relative overflow-hidden group
                            ${isListening 
                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                            }`}
                    >
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{drum.label}</div>
                        <div className="flex flex-wrap justify-center gap-2 min-h-[28px]">
                            {keys.length > 0 ? (
                                keys.map(k => (
                                    <span key={k} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono font-bold border border-gray-200">
                                        {k}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-300 text-sm italic">Unmapped</span>
                            )}
                        </div>
                        
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
