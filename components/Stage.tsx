import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Song, ScoreState, DrumType, PracticeConfig, TimingRating, Note } from '../types';
import { PIXELS_PER_SECOND, STAFF_LINE_SPACING, PLAYHEAD_X_OFFSET, TIMING_WINDOWS, RATING_SCORES, DRUM_POSITIONS } from '../constants';
import DrumNotation, { BeamConfig } from './DrumNotation';
import { midiService } from '../services/midiService';
import { getKeyboardMap } from '../services/inputService';
import { Play, Pause, RefreshCw, Sliders, ChevronLeft, Hand, Turtle } from 'lucide-react';

interface StageProps {
  song: Song;
  onExit: () => void;
}

const Stage: React.FC<StageProps> = ({ song, onExit }) => {
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [keyboardMap, setKeyboardMap] = useState<Record<string, DrumType>>(() => getKeyboardMap());
  const [centerY, setCenterY] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
        if (containerRef.current) {
            setCenterY(containerRef.current.clientHeight / 2);
        }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);
  
  // Practice Config
  const [practiceConfig, setPracticeConfig] = useState<PracticeConfig>({
    active: false,
    playbackSpeed: 1.0,
    loopStart: 0,
    loopEnd: song.duration,
    waitMode: false
  });

  // Notes & Score
  const [internalNotes, setInternalNotes] = useState(song.notes);
  
  const initialScoreState: ScoreState = {
    score: 0, streak: 0, maxStreak: 0, hits: 0, misses: 0, perfects: 0, goods: 0, okays: 0, usedWaitMode: false
  };

  const [scoreState, setScoreState] = useState<ScoreState>(initialScoreState);

  // Refs for physics loop
  const requestRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const physicsTimeRef = useRef<number>(0);
  const notesRef = useRef(song.notes);
  const scoreRef = useRef(initialScoreState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Constants for Count-in
  const beatDuration = 60 / song.bpm;
  const countInDuration = beatDuration * 4 * 2; // 2 bars

  // Initialize/Reset
  useEffect(() => {
    resetGame();
  }, [song]);

  // Handle Audio Playback
  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            // Sync audio time if it drifted significantly or just started
            // But usually we drive game time FROM audio time if audio exists
            if (currentTime >= 0) {
                if (Math.abs(audioRef.current.currentTime - currentTime) > 0.1) {
                    audioRef.current.currentTime = Math.max(0, currentTime);
                }
                audioRef.current.play().catch(e => console.warn("Audio play failed", e));
            } else {
                // In count-in, pause audio
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying]);

  // Update playback rate
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = practiceConfig.playbackSpeed;
      }
  }, [practiceConfig.playbackSpeed]);

  // Track Wait Mode Usage
  useEffect(() => {
    if (practiceConfig.waitMode && !scoreRef.current.usedWaitMode) {
      scoreRef.current.usedWaitMode = true;
      setScoreState(prev => ({ ...prev, usedWaitMode: true }));
    }
  }, [practiceConfig.waitMode]);

  const resetGame = () => {
    const freshNotes = song.notes.map(n => ({ ...n, hit: false, missed: false, processed: false, rating: undefined }));
    setInternalNotes(freshNotes);
    notesRef.current = freshNotes;
    
    // Start at negative time for count-in if not practicing specific loop
    const startTime = practiceConfig.active ? practiceConfig.loopStart : -countInDuration;
    
    physicsTimeRef.current = startTime;
    setCurrentTime(startTime);
    
    if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, startTime);
        audioRef.current.pause();
    }

    const newScore = { 
        ...initialScoreState,
        usedWaitMode: practiceConfig.waitMode // If starting with it on, mark it used
    };

    setScoreState(newScore);
    scoreRef.current = newScore;
    setIsFinished(false);
    
    // Auto-play on load/reset
    setIsPlaying(true);
  };

  const handleInput = (type: DrumType) => {
    if (!isPlaying) return;

    const now = physicsTimeRef.current;
    
    // Find closest unprocessed note of type
    const candidate = notesRef.current.find(n => 
      !n.processed && 
      n.type === type && 
      (Math.abs(n.time - now) <= TIMING_WINDOWS[TimingRating.OKAY] || 
       // Special case for Wait Mode: Allow hitting if we are "stuck" just before the note
       (practiceConfig.waitMode && n.time >= now && n.time - now < 0.05))
    );

    if (candidate) {
      const diff = Math.abs(candidate.time - now);
      let rating = TimingRating.OKAY;
      
      if (diff <= TIMING_WINDOWS[TimingRating.PERFECT]) rating = TimingRating.PERFECT;
      else if (diff <= TIMING_WINDOWS[TimingRating.GOOD]) rating = TimingRating.GOOD;

      // Update Note
      candidate.hit = true;
      candidate.processed = true;
      candidate.rating = rating;
      candidate.timeOffset = diff;

      // Update Score
      const points = RATING_SCORES[rating];
      scoreRef.current.score += points + (scoreRef.current.streak * 2);
      scoreRef.current.hits++;
      scoreRef.current.streak++;
      scoreRef.current.maxStreak = Math.max(scoreRef.current.streak, scoreRef.current.maxStreak);
      
      if (rating === TimingRating.PERFECT) scoreRef.current.perfects++;
      else if (rating === TimingRating.GOOD) scoreRef.current.goods++;
      else scoreRef.current.okays++;

      setInternalNotes([...notesRef.current]);
      setScoreState({...scoreRef.current});
    }
  };

  // Input Listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (keyboardMap[e.key]) {
          e.preventDefault();
          handleInput(keyboardMap[e.key]);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    const unsubMidi = midiService.subscribe((type) => handleInput(type));
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      unsubMidi();
    };
  }, [isPlaying, practiceConfig, keyboardMap]);

  // Game Loop
  useEffect(() => {
    const animate = (time: number) => {
      if (!isPlaying) return;

      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = time;
      }

      const delta = (time - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = time;

      // Apply Playback Speed
      let effectiveDelta = delta * practiceConfig.playbackSpeed;
      
      // --- AUDIO SYNC ---
      // If audio is playing and we are past count-in, sync time to audio
      if (audioRef.current && !audioRef.current.paused && physicsTimeRef.current > 0) {
          const audioTime = audioRef.current.currentTime;
          // If drift is significant (> 50ms), snap to audio time
          // Otherwise, just use the audio time directly for smoothness if possible, 
          // or interpolate. For rhythm games, audio is the master clock.
          if (Math.abs(audioTime - physicsTimeRef.current) > 0.05) {
             physicsTimeRef.current = audioTime;
             // Adjust delta to match the jump? No, just snap.
          } else {
             // Use audio time but smooth it? 
             // Actually, let's just trust audio time if it's progressing
             physicsTimeRef.current = audioTime;
          }
          // Recalculate effectiveDelta based on the snap? 
          // No, effectiveDelta is used for "nextTime" prediction, but if we have audio, 
          // we just set nextTime = audioTime.
          
          // However, we need effectiveDelta for Wait Mode logic below.
          // If we use audio, we are NOT in Wait Mode (usually). 
          // Wait Mode + Audio is complex (audio must pause).
      }
      
      // --- WAIT MODE LOGIC ---
      // Works in both Practice Mode and Normal Mode if enabled
      if (practiceConfig.waitMode) {
          // Find the earliest upcoming unprocessed note
          const nextNote = notesRef.current.find(n => !n.processed && n.time >= physicsTimeRef.current - 0.005);
          
          if (nextNote) {
              const distanceToNote = nextNote.time - physicsTimeRef.current;
              
              // If we are about to pass the note in this frame, or we are already there/past it
              if (distanceToNote <= effectiveDelta) {
                  // Snap exactly to the note time
                  effectiveDelta = Math.max(0, distanceToNote);
                  
                  // If we are waiting, PAUSE AUDIO
                  if (audioRef.current && !audioRef.current.paused) {
                      audioRef.current.pause();
                  }
              } else {
                  // If we are moving towards a note and NOT waiting yet, ensure audio is playing
                  if (audioRef.current && audioRef.current.paused && isPlaying) {
                      audioRef.current.play();
                  }
              }
          }
      }
      // -----------------------

      let nextTime = physicsTimeRef.current + effectiveDelta;
      
      // If using audio as master clock, nextTime is already set above via physicsTimeRef.current = audioTime
      // But we need to handle the case where we are in count-in (negative time)
      if (audioRef.current && !audioRef.current.paused && physicsTimeRef.current > 0 && !practiceConfig.waitMode) {
          nextTime = audioRef.current.currentTime;
      }

      // Loop Logic (Only if Practice Active)
      if (practiceConfig.active && nextTime >= practiceConfig.loopEnd) {
        nextTime = practiceConfig.loopStart;
        // Reset notes in loop range
        notesRef.current.forEach(n => {
          if (n.time >= practiceConfig.loopStart && n.time <= practiceConfig.loopEnd) {
            n.processed = false;
            n.hit = false;
            n.missed = false;
            n.rating = undefined;
          }
        });
        setInternalNotes([...notesRef.current]);
      } else if (!practiceConfig.active && nextTime >= song.duration) {
        setIsPlaying(false);
        setIsFinished(true);
        return;
      }

      physicsTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      // Check Misses (only if time > 0)
      if (nextTime > 0) {
        let changed = false;
        notesRef.current.forEach(n => {
          if (!n.processed && !n.missed && (nextTime - n.time) > TIMING_WINDOWS[TimingRating.OKAY]) {
            n.missed = true;
            n.processed = true;
            scoreRef.current.misses++;
            scoreRef.current.streak = 0;
            changed = true;
          }
        });

        if (changed) {
          setInternalNotes([...notesRef.current]);
          setScoreState({...scoreRef.current});
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      lastFrameTimeRef.current = 0; // Reset delta calculator
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, practiceConfig, song]);


  // Play/Pause Handler
  const togglePlay = () => {
      if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
      }
      setIsPlaying(!isPlaying);
  };

  // Render Helpers
  const renderWindowStart = currentTime - 2;
  const renderWindowEnd = currentTime + 6;
  const visibleNotes = internalNotes.filter(n => n.time >= renderWindowStart && n.time <= renderWindowEnd);
  
  // Wait Mode: Identify the notes we are waiting for (handling chords)
  const blockingNoteIds = useMemo(() => {
    if (!practiceConfig.waitMode) return new Set<string>();
    
    // Find the very first note that is blocking
    // We assume notes are sorted by time (which they are in getLibrary/import)
    const startIdx = internalNotes.findIndex(n => !n.processed && n.time >= physicsTimeRef.current - 0.005);
    
    if (startIdx === -1) return new Set<string>();
    
    const firstBlocking = internalNotes[startIdx];
    const ids = new Set<string>();
    ids.add(firstBlocking.id);

    // Look ahead for concurrent notes (chords)
    for (let i = startIdx + 1; i < internalNotes.length; i++) {
        // Tolerance of 20ms for simultaneous notes
        if (Math.abs(internalNotes[i].time - firstBlocking.time) < 0.02) {
            ids.add(internalNotes[i].id);
        } else {
            // Since sorted, we can break early once we pass the time window
            if (internalNotes[i].time > firstBlocking.time + 0.02) break;
        }
    }
    
    return ids;
  }, [internalNotes, practiceConfig.waitMode, currentTime]);

  // --- BEAM CALCULATION LOGIC ---
  const beamConfigs = useMemo(() => {
    const configs: Record<string, BeamConfig> = {};
    if (visibleNotes.length === 0) return configs;

    const quarterNoteTime = 60 / song.bpm;
    const eighthNoteThreshold = quarterNoteTime * 0.75; // Loose threshold
    const sixteenthNoteThreshold = quarterNoteTime * 0.35;

    // Helper to process a list of notes (Voice)
    const processVoice = (voiceNotes: Note[], isStemUp: boolean) => {
        // Sort by time
        voiceNotes.sort((a, b) => a.time - b.time);

        let group: Note[] = [];
        
        const flushGroup = () => {
            if (group.length === 0) return;
            
            // Determine Beam Y Height
            // For Stem Up (Hands): Find the visually highest note (lowest Y value) and go up
            // For Stem Down (Feet): Find the visually lowest note (highest Y value) and go down
            const noteYs = group.map(n => (DRUM_POSITIONS[n.type] || 0) * (STAFF_LINE_SPACING / 2));
            
            let beamY = 0;
            const stemMinLen = STAFF_LINE_SPACING * 1.75; // Minimum stem length

            if (isStemUp) {
                // Find min Y (highest note)
                const minY = Math.min(...noteYs);
                beamY = minY - stemMinLen;
                // Snap to some grid if we wanted to be fancy, but this is fine
            } else {
                // Find max Y (lowest note)
                const maxY = Math.max(...noteYs);
                beamY = maxY + stemMinLen;
            }

            // Assign configs
            for (let i = 0; i < group.length; i++) {
                const note = group[i];
                const beams = [];
                
                // If not last note, check connection to next
                if (i < group.length - 1) {
                    const nextNote = group[i+1];
                    const diff = nextNote.time - note.time;
                    const width = diff * PIXELS_PER_SECOND;
                    
                    // Add Primary Beam (8th)
                    beams.push({ width, isDouble: false });

                    // Add Secondary Beam (16th) if close enough
                    if (diff <= sixteenthNoteThreshold) {
                         beams.push({ width, isDouble: true });
                    }
                }

                configs[note.id] = {
                    stemEndY: beamY,
                    beams
                };
            }
            group = [];
        };

        for (let i = 0; i < voiceNotes.length; i++) {
            const note = voiceNotes[i];
            
            if (group.length === 0) {
                group.push(note);
            } else {
                const prev = group[group.length - 1];
                const delta = note.time - prev.time;
                
                // Check if should be grouped
                // 1. Close enough in time
                // 2. Or simultaneous (chord) - delta is 0
                if (delta <= eighthNoteThreshold) {
                    group.push(note);
                } else {
                    flushGroup();
                    group.push(note);
                }
            }
        }
        flushGroup();
    };

    // Separate Voices
    const hands = visibleNotes.filter(n => ![DrumType.KICK].includes(n.type));
    const feet = visibleNotes.filter(n => [DrumType.KICK].includes(n.type));

    processVoice(hands, true);
    processVoice(feet, false);

    return configs;
  }, [visibleNotes, song.bpm]);

  const staffLines = [-2, -1, 0, 1, 2];
  
  // Ordered labels for the left side of stave
  const drumLabels = [
    { type: DrumType.CRASH, label: 'Crash' },
    { type: DrumType.HIHAT_CLOSED, label: 'Hi-Hat' },
    { type: DrumType.RIDE, label: 'Ride' },
    { type: DrumType.TOM1, label: 'High Tom' },
    { type: DrumType.TOM2, label: 'Mid Tom' },
    { type: DrumType.SNARE, label: 'Snare' },
    { type: DrumType.FLOOR_TOM, label: 'Floor Tom' },
    { type: DrumType.KICK, label: 'Kick' },
  ];

  const getKeysForDrum = (drumType: DrumType) => {
    return Object.entries(keyboardMap)
      .filter(([_, dt]) => dt === drumType)
      .map(([key]) => key === ' ' ? 'Space' : key.toUpperCase());
  };

  const getCountInDisplay = () => {
      if (currentTime >= 0) return null;
      const beatsRemaining = Math.ceil(Math.abs(currentTime / beatDuration));
      if (beatsRemaining > 4) return "GET READY";
      return beatsRemaining.toString();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none">
      
      {/* Top Bar */}
      <div className="bg-white border-b p-2 sm:p-4 flex items-center justify-between z-20 shadow-sm h-14 sm:h-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ChevronLeft size={20} />
            </button>
            <div>
                <h2 className="font-display font-bold text-lg sm:text-2xl leading-none tracking-wide text-gray-900 truncate max-w-[150px] sm:max-w-md">{song.title}</h2>
                <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">{song.artist}</span>
            </div>
        </div>

        {/* Score Display */}
        <div className="flex gap-4 sm:gap-8">
            <div className="text-right">
                <div className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Score</div>
                <div className="font-display font-bold text-xl sm:text-3xl text-indigo-600 leading-none">{scoreState.score.toLocaleString()}</div>
            </div>
             <div className="text-right">
                <div className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Streak</div>
                <div className="font-display font-bold text-xl sm:text-3xl text-yellow-500 leading-none">{scoreState.streak}x</div>
            </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative bg-gray-50 flex flex-col overflow-hidden">
         
         {/* Audio Element */}
         {song.audioUrl && (
             <audio 
                 ref={audioRef} 
                 src={song.audioUrl} 
                 preload="auto"
                 onEnded={() => {
                     setIsPlaying(false);
                     setIsFinished(true);
                 }}
             />
         )}

         {/* Count-In Overlay */}
         {isPlaying && currentTime < 0 && (
             <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                 <div className="text-9xl font-display font-bold text-indigo-600 animate-pulse tracking-widest">
                     {getCountInDisplay()}
                 </div>
             </div>
         )}
         
         {/* Wait Mode Indicator */}
         {practiceConfig.waitMode && isPlaying && currentTime >= 0 && (
             <div className="absolute top-8 left-0 right-0 flex justify-center z-30">
                 <div className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-display font-bold tracking-widest animate-pulse shadow-lg flex items-center gap-2">
                     <Hand size={16} />
                     WAIT MODE ACTIVE
                 </div>
             </div>
         )}

         {/* Canvas */}
         <div ref={containerRef} className="relative flex-1 w-full border-t border-b border-gray-200 bg-white shadow-sm overflow-hidden">
            
            {/* Fade Overlay on Left */}
            <div className="absolute top-0 bottom-0 left-0 w-48 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />

            {/* Static Drum Labels */}
            {drumLabels.map(d => {
                const keys = getKeysForDrum(d.type);
                return (
                <div 
                    key={d.type}
                    className="absolute z-20 text-[8px] sm:text-[10px] font-bold text-gray-400/50 uppercase tracking-widest text-right w-32 select-none pointer-events-none"
                    style={{
                        top: `${centerY + (DRUM_POSITIONS[d.type] * (STAFF_LINE_SPACING / 2))}px`,
                        left: '20px',
                        transform: 'translateY(-50%)'
                    }}
                >
                    {d.label}
                    {keys.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-mono text-[8px] sm:text-[9px]">
                            {keys.join('/')}
                        </span>
                    )}
                </div>
            )})}

            {/* Timing Zones (Background) */}
            <div className="absolute top-0 bottom-0 z-0 pointer-events-none" style={{ left: `${PLAYHEAD_X_OFFSET}px` }}>
                <div className="absolute top-0 bottom-0 -translate-x-1/2 bg-blue-500/[0.02] border-x border-blue-500/[0.05]" style={{ width: `${TIMING_WINDOWS[TimingRating.OKAY] * 2 * PIXELS_PER_SECOND}px` }} />
                <div className="absolute top-0 bottom-0 -translate-x-1/2 bg-green-500/[0.04] border-x border-green-500/[0.1]" style={{ width: `${TIMING_WINDOWS[TimingRating.GOOD] * 2 * PIXELS_PER_SECOND}px` }} />
                <div className="absolute top-0 bottom-0 -translate-x-1/2 bg-yellow-500/[0.08] border-x border-yellow-500/[0.2]" style={{ width: `${TIMING_WINDOWS[TimingRating.PERFECT] * 2 * PIXELS_PER_SECOND}px` }} />
            </div>

            <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-indigo-500" style={{ left: `${PLAYHEAD_X_OFFSET}px` }}>
                <div className="absolute -top-1 -left-1.5 w-4 h-4 text-indigo-500">▼</div>
                <div className="absolute -bottom-3 -left-1.5 w-4 h-4 text-indigo-500">▲</div>
            </div>

            <svg className="w-full h-full absolute inset-0 z-0">
                <g transform={`translate(${PLAYHEAD_X_OFFSET}, ${centerY})`}>
                    {staffLines.map(lineIndex => (
                        <line key={lineIndex} x1={-PLAYHEAD_X_OFFSET} y1={lineIndex * STAFF_LINE_SPACING} x2="2000" y2={lineIndex * STAFF_LINE_SPACING} stroke="#e5e7eb" strokeWidth={2} />
                    ))}
                    
                    {visibleNotes.map(note => (
                        <DrumNotation 
                            key={note.id} 
                            note={note} 
                            relativeTime={note.time - currentTime} 
                            pixelsPerSecond={PIXELS_PER_SECOND}
                            beamConfig={beamConfigs[note.id]}
                            showLabel={practiceConfig.waitMode && blockingNoteIds.has(note.id)} 
                        />
                    ))}
                </g>
            </svg>
         </div>

         {/* Transport Controls */}
         <div className="bg-white border-t p-2 sm:p-4 pb-4 sm:pb-8 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
            <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-4">
                
                {/* Timeline */}
                <div className="relative h-4 sm:h-8 bg-gray-100 rounded-lg overflow-hidden cursor-pointer" 
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const newTime = pct * song.duration;
                        physicsTimeRef.current = newTime;
                        setCurrentTime(newTime);
                    }}
                >
                    <div className="absolute top-0 bottom-0 left-0 bg-indigo-100 border-r border-indigo-300" style={{ width: `${Math.max(0, (currentTime / song.duration) * 100)}%` }}></div>
                    {practiceConfig.active && (
                        <div 
                            className="absolute top-0 bottom-0 bg-blue-500 opacity-20 border-l border-r border-blue-600"
                            style={{ 
                                left: `${(practiceConfig.loopStart / song.duration) * 100}%`,
                                width: `${((practiceConfig.loopEnd - practiceConfig.loopStart) / song.duration) * 100}%` 
                            }}
                        ></div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between">
                    
                    {/* Practice Toggle */}
                    <button 
                        onClick={() => {
                            setPracticeConfig(prev => {
                                const newActive = !prev.active;
                                // Automatically enable Wait Mode when Practice Mode is turned ON
                                return { 
                                    ...prev, 
                                    active: newActive,
                                    waitMode: newActive ? true : prev.waitMode 
                                };
                            });
                            notesRef.current.forEach(n => { n.processed = false; n.hit = false; n.missed = false; });
                            setInternalNotes([...notesRef.current]);
                        }}
                        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors ${practiceConfig.active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Sliders size={14} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="hidden sm:inline">PRACTICE MODE</span>
                        <span className="sm:hidden">PRACTICE</span>
                    </button>

                    {/* Main Playback */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={resetGame} className="p-2 sm:p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                            <RefreshCw size={18} className="sm:w-[24px] sm:h-[24px]" />
                        </button>
                        <button 
                            onClick={togglePlay} 
                            className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
                        >
                            {isPlaying ? <Pause size={20} className="sm:w-[28px] sm:h-[28px]" fill="currentColor" /> : <Play size={20} className="sm:w-[28px] sm:h-[28px]" fill="currentColor" ml={1} />}
                        </button>
                    </div>

                    {/* Settings Group - Always visible now */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Wait Mode Toggle */}
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase hidden sm:block">Wait Mode</span>
                            <button
                                onClick={() => setPracticeConfig(prev => ({ ...prev, waitMode: !prev.waitMode }))}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 ${practiceConfig.waitMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                title="Wait for input at each note"
                            >
                                <Hand size={14} className="sm:w-[16px] sm:h-[16px]" />
                                <span className="text-[10px] sm:text-xs font-bold">{practiceConfig.waitMode ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>

                        <div className="w-px h-6 sm:h-8 bg-gray-200"></div>

                        {/* Speed Controls */}
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase hidden sm:block">Speed</span>
                            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 sm:p-1">
                                {[0.5, 0.75, 1.0, 1.25].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setPracticeConfig(prev => ({ ...prev, playbackSpeed: speed }))}
                                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded ${practiceConfig.playbackSpeed === speed ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>

      </div>

        {/* Results Modal */}
        {isFinished && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl max-w-lg w-full text-center relative overflow-hidden">
                    {/* Badge if Wait Mode was used */}
                    {scoreState.usedWaitMode && (
                        <div className="absolute top-5 right-5 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Hand size={12} />
                            Wait Mode Used
                        </div>
                    )}

                    <h2 className="text-5xl font-display font-bold mb-6 text-gray-900 tracking-wide">SESSION COMPLETE</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Accuracy</div>
                            <div className="text-4xl font-display font-bold text-gray-900 mt-1">
                                {scoreState.hits + scoreState.misses > 0 
                                    ? Math.round((scoreState.hits / (scoreState.hits + scoreState.misses)) * 100)
                                    : 0}%
                            </div>
                        </div>
                         <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Max Streak</div>
                            <div className="text-4xl font-display font-bold text-yellow-500 mt-1">{scoreState.maxStreak}</div>
                        </div>
                        <div className="col-span-2 flex justify-between px-8 pt-2">
                             <div className="text-green-600 font-bold font-display text-xl">{scoreState.perfects} <span className="text-sm font-sans font-normal text-gray-400">Perfect</span></div>
                             <div className="text-teal-600 font-bold font-display text-xl">{scoreState.goods} <span className="text-sm font-sans font-normal text-gray-400">Good</span></div>
                             <div className="text-blue-600 font-bold font-display text-xl">{scoreState.okays} <span className="text-sm font-sans font-normal text-gray-400">Okay</span></div>
                             <div className="text-red-500 font-bold font-display text-xl">{scoreState.misses} <span className="text-sm font-sans font-normal text-gray-400">Miss</span></div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onExit} className="flex-1 py-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl uppercase tracking-widest text-sm">Library</button>
                        <button onClick={resetGame} className="flex-1 py-4 font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl uppercase tracking-widest text-sm shadow-lg">Replay</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default Stage;