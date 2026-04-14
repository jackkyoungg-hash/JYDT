
import React, { useRef, useState, useEffect } from 'react';
import { Song } from '../types';
import { Play, Music, Star, Upload, Search, Disc, Clock, Calendar, User, Drum } from 'lucide-react';

interface SongLibraryProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onImportSong: (file: File) => void;
  onBack: () => void;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ songs, onSelectSong, onImportSong, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Filter songs
  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSong = filteredSongs[selectedIndex];

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent navigation if focused on search input
      if (document.activeElement?.tagName === 'INPUT') {
          if (e.key === 'Enter') {
              (document.activeElement as HTMLElement)?.blur(); // Exit search on Enter
          }
          return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(filteredSongs.length - 1, prev + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSong) onSelectSong(selectedSong);
          break;
        case 'Escape':
          e.preventDefault();
          onBack();
          break;
        case ' ': // Import shortcut
          if (e.ctrlKey) {
             e.preventDefault();
             fileInputRef.current?.click();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSongs, selectedSong, onSelectSong, onBack]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportSong(e.target.files[0]);
      e.target.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to get random "star rating" for UI visualization
  const getStars = (seed: string) => {
      const val = seed.charCodeAt(0) % 7;
      return Math.max(0, val);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 text-gray-900 overflow-hidden relative font-sans">
      
      {/* Background Texture - Light Mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white z-0"></div>
      
      {/* Top Bar */}
      <div className="relative z-10 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
         <div className="flex items-center gap-6">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                title="Back to Menu (Esc)"
            >
                <div className="p-1 bg-gray-100 rounded-md border border-gray-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Menu</span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-widest text-xs uppercase">
                <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>
                <span>Sorting: Artist</span>
            </div>
            <span className="text-gray-400 font-bold text-xs tracking-widest uppercase">{filteredSongs.length} Songs</span>
         </div>
         
         <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
            <Search size={16} className="text-gray-400" />
            <input 
                type="text" 
                placeholder="Search Library..." 
                className="bg-transparent border-none outline-none text-gray-900 w-48 text-sm font-semibold placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                }}
            />
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* Left: Song List */}
        <div className="w-1/2 md:w-2/3 flex flex-col border-r border-gray-200 bg-white/50 backdrop-blur-sm relative">
             {/* Header for Section */}
             <div className="bg-gray-100/80 px-4 md:px-6 py-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-200 sticky top-0 z-20">
                 Local Library
             </div>

             <div className="flex-1 overflow-y-auto pb-20" ref={listRef}>
                {filteredSongs.map((song, idx) => {
                    const isSelected = idx === selectedIndex;
                    const stars = getStars(song.id);
                    
                    return (
                        <div 
                            key={song.id}
                            onClick={() => setSelectedIndex(idx)}
                            onDoubleClick={() => onSelectSong(song)}
                            className={`
                                group px-4 md:px-6 py-2 md:py-3 cursor-pointer flex items-center justify-between transition-all duration-100 border-l-4
                                ${isSelected 
                                    ? 'bg-white border-indigo-600 shadow-[0_4px_20px_-5px_rgba(79,70,229,0.15)] z-10 translate-x-1' 
                                    : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }
                            `}
                        >
                            <div className="flex flex-col leading-tight">
                                <span className={`text-[8px] md:text-[10px] uppercase font-bold tracking-wider mb-0.5 transition-colors ${isSelected ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                    {song.artist}
                                </span>
                                <span className={`text-lg md:text-xl font-display font-bold tracking-wide transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                    {song.title}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex gap-0.5">
                                    {Array.from({length: 5}).map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={12} 
                                            className={i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                                        />
                                    ))}
                                </div>
                                {isSelected && (
                                    <div className="bg-indigo-600 rounded-full p-1 shadow-md animate-in fade-in zoom-in duration-200">
                                        <Play size={14} className="text-white fill-white ml-0.5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {filteredSongs.length === 0 && (
                    <div className="p-10 text-center flex flex-col items-center gap-2 text-gray-400">
                        <Disc size={48} strokeWidth={1} />
                        <span className="font-bold uppercase tracking-widest text-sm">No songs found</span>
                    </div>
                )}
             </div>
        </div>

        {/* Right: Details Panel */}
        <div className="w-1/2 md:w-1/3 bg-white p-4 md:p-8 flex flex-col shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)] z-20 relative overflow-y-auto">
            {selectedSong ? (
                <>
                    {/* Album Art Placeholder - Hidden on small screens */}
                    <div className="hidden md:block aspect-square w-full bg-gray-100 rounded-2xl mb-8 shadow-inner border border-gray-200 overflow-hidden relative group">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                             <Music size={100} strokeWidth={0.5} />
                        </div>
                         {/* Simulate Art with gradient based on Difficulty */}
                         <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${
                             selectedSong.difficulty === 'BEGINNER' ? 'from-green-500 to-emerald-900' : 
                             selectedSong.difficulty === 'INTERMEDIATE' ? 'from-yellow-500 to-orange-900' : 
                             'from-red-500 to-rose-900'
                         }`}></div>
                         
                         {/* Song Title Overlay on Art */}
                         <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent pt-12">
                             <h2 className="text-4xl font-display font-bold text-gray-900 leading-none drop-shadow-sm">{selectedSong.artist}</h2>
                         </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-4 text-sm mb-4 md:mb-8">
                        <div className="col-span-2 border-b-2 border-indigo-100 pb-2 md:pb-4 mb-2">
                             <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 leading-none">{selectedSong.title}</h1>
                             <span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-wide block mt-1">{selectedSong.artist}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">
                                <Disc size={10} /> Album
                            </span>
                            <span className="font-bold text-gray-700 truncate text-xs md:text-sm">{selectedSong.album || 'Unknown Album'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">
                                <Calendar size={10} /> Year
                            </span>
                            <span className="font-bold text-gray-700 text-xs md:text-sm">{selectedSong.year || '----'}</span>
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">
                                <Music size={10} /> Genre
                            </span>
                            <span className="font-bold text-gray-700 text-xs md:text-sm">{selectedSong.genre}</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">
                                <Clock size={10} /> Length
                            </span>
                            <span className="font-bold text-gray-700 text-xs md:text-sm">{formatTime(selectedSong.duration)}</span>
                        </div>

                        <div className="col-span-2 pt-2 flex flex-col">
                             <span className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-1">
                                <User size={10} /> Charter
                             </span>
                             <span className="font-bold text-gray-500 text-xs">{selectedSong.charter || 'Unknown'}</span>
                        </div>
                    </div>

                    {/* Difficulty / Instruments Section */}
                    <div className="mt-auto bg-gray-50 rounded-xl p-3 md:p-5 border border-gray-200">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Difficulty</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 bg-white shadow-sm ${
                                    selectedSong.difficulty === 'BEGINNER' ? 'border-green-500 text-green-500' :
                                    selectedSong.difficulty === 'INTERMEDIATE' ? 'border-yellow-500 text-yellow-500' :
                                    'border-red-500 text-red-500'
                                }`}>
                                    <Drum size={16} className="md:w-5 md:h-5" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-wide">Drums</span>
                                    <div className="flex gap-1">
                                         {/* Difficulty Pips */}
                                         {Array.from({length: 6}).map((_, i) => (
                                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                 i < (selectedSong.difficulty === 'BEGINNER' ? 2 : selectedSong.difficulty === 'INTERMEDIATE' ? 4 : 6)
                                                 ? (selectedSong.difficulty === 'BEGINNER' ? 'bg-green-500' : selectedSong.difficulty === 'INTERMEDIATE' ? 'bg-yellow-500' : 'bg-red-500') 
                                                 : 'bg-gray-200'
                                             }`}></div>
                                         ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelectSong(selectedSong)}
                        className="mt-4 md:mt-6 w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                        <Play size={18} fill="currentColor" className="md:w-5 md:h-5" /> Play Song
                    </button>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
                    <Music size={48} className="md:w-16 md:h-16" />
                    <span className="font-bold uppercase tracking-widest text-xs md:text-sm">Select a song to view details</span>
                </div>
            )}
        </div>
      </div>

      {/* Footer / Controls Bar */}
      <div className="bg-white text-gray-600 px-8 py-3 flex items-center justify-between border-t border-gray-200 z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
         <div className="flex gap-8">
             <div className="flex items-center gap-2">
                 <kbd className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border-b-2 border-gray-200 font-mono">ENTER</kbd>
                 <span className="text-[10px] font-bold tracking-widest uppercase">Select</span>
             </div>
             <div className="flex items-center gap-2">
                 <kbd className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border-b-2 border-gray-200 font-mono">DBL CLICK</kbd>
                 <span className="text-[10px] font-bold tracking-widest uppercase">Play</span>
             </div>
             <div className="flex items-center gap-2">
                 <kbd className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border-b-2 border-gray-200 font-mono">↑ / ↓</kbd>
                 <span className="text-[10px] font-bold tracking-widest uppercase">Navigate</span>
             </div>
         </div>
         
         <div className="flex gap-4">
             <input 
                type="file" 
                accept=".mid,.midi" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
            />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors"
             >
                 <kbd className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border-b-2 border-gray-200 font-mono">CTRL+SPACE</kbd>
                 <span className="text-[10px] font-bold tracking-widest uppercase">Import MIDI</span>
             </button>
         </div>
      </div>

    </div>
  );
};

export default SongLibrary;
