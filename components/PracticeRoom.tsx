import React, { useState, useRef } from 'react';
import { ArrowLeft, Drum, PlayCircle, Clock, Music, BookOpen, Zap, HelpCircle, Upload, Play } from 'lucide-react';
import { Song } from '../types';

interface PracticeRoomProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onImportSong: (midiFile: File, category: string, audioFile?: File) => void;
  onBack: () => void;
}

const PracticeRoom: React.FC<PracticeRoomProps> = ({ songs, onSelectSong, onImportSong, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { title: 'Exercises', icon: <Drum size={32} />, desc: 'Warm-ups and technical drills', color: 'text-blue-500', bg: 'bg-blue-50', hover: 'group-hover:bg-blue-100' },
    { title: 'Beats', icon: <Music size={32} />, desc: 'Grooves and patterns', color: 'text-green-500', bg: 'bg-green-50', hover: 'group-hover:bg-green-100' },
    { title: 'Fills', icon: <Zap size={32} />, desc: 'Transitions and chops', color: 'text-yellow-500', bg: 'bg-yellow-50', hover: 'group-hover:bg-yellow-100' },
    { title: 'Rudiments', icon: <BookOpen size={32} />, desc: 'The 40 essential rudiments', color: 'text-orange-500', bg: 'bg-orange-50', hover: 'group-hover:bg-orange-100' },
    { title: 'Rudiment Applications', icon: <PlayCircle size={32} />, desc: 'Applying rudiments to the kit', color: 'text-red-500', bg: 'bg-red-50', hover: 'group-hover:bg-red-100' },
    { title: 'Concepts', icon: <Clock size={32} />, desc: 'Timing, dynamics, and feel', color: 'text-purple-500', bg: 'bg-purple-50', hover: 'group-hover:bg-purple-100' },
    { title: 'Other', icon: <HelpCircle size={32} />, desc: 'Miscellaneous challenges', color: 'text-gray-500', bg: 'bg-gray-50', hover: 'group-hover:bg-gray-100' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedCategory) {
      // Check if we have multiple files (MIDI + Audio) or just one
      let midiFile: File | undefined;
      let audioFile: File | undefined;

      Array.from(e.target.files).forEach(file => {
          if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
              midiFile = file;
          } else if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.aif') || file.name.toLowerCase().endsWith('.aiff') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
              audioFile = file;
          }
      });

      if (midiFile) {
          onImportSong(midiFile, selectedCategory, audioFile);
      } else {
          alert("Please select at least a MIDI file (.mid). You can also select an audio file (.mp3, .wav, .aif) at the same time.");
      }
      e.target.value = '';
    }
  };

  const categorySongs = selectedCategory 
    ? songs.filter(s => s.category === selectedCategory)
    : [];

  if (selectedCategory) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors mr-4"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-4xl font-display font-bold text-gray-900 uppercase">{selectedCategory}</h1>
            </div>
            
            <div>
              <input 
                type="file" 
                accept=".mid,.midi,.mp3,.wav,.aif,.aiff,.ogg" 
                multiple
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Upload size={18} />
                <span>Import Song (MIDI + Audio)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            {categorySongs.length > 0 ? (
              <div className="space-y-1">
                {categorySongs.map((song) => (
                  <div 
                    key={song.id}
                    onClick={() => onSelectSong(song)}
                    className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Play size={20} fill="currentColor" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{song.title}</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{song.artist || 'Unknown Artist'}</p>
                      </div>
                    </div>
                    <div className="text-sm font-mono text-gray-400">
                      {Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="p-6 bg-gray-50 rounded-full">
                  <Upload size={48} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Exercises Yet</h3>
                  <p className="max-w-xs mx-auto text-sm">
                    Import a MIDI file to add it to your {selectedCategory} library.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-4xl font-display font-bold text-gray-900">PRACTICE ROOM</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {categories.map((cat) => (
            <div 
              key={cat.title} 
              onClick={() => setSelectedCategory(cat.title)}
              className="group relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer h-full flex flex-col hover:-translate-y-1"
            >
              <div className={`absolute top-4 right-4 text-gray-300 group-hover:${cat.color} transition-colors`}>
                {cat.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 pr-8">{cat.title}</h2>
              <p className="text-gray-500 text-sm mb-4 flex-1">
                {cat.desc}
              </p>
              <button className={`mt-4 px-4 py-2 ${cat.bg} ${cat.color.replace('text-', 'text-').replace('500', '700')} font-bold rounded-lg text-sm ${cat.hover} transition-colors w-full text-center`}>
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeRoom;
