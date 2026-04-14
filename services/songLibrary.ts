
import { Song, DrumType } from '../types';
import { v4 as uuidv4 } from 'uuid';

type PatternType = 'rock' | 'funk' | 'jazz' | 'pop' | 'blues' | 'metal' | 'latin' | 'reggae';

const generateNotes = (bpm: number, bars: number, pattern: PatternType): any[] => {
  const notes: any[] = [];
  const beatTime = 60 / bpm;
  
  for (let i = 0; i < bars; i++) {
    const measureTime = i * (beatTime * 4);

    if (pattern === 'rock') {
      // Basic Rock: Kick 1/3, Snare 2/4, Hats 8ths
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        // Hats every 8th
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        
        if (beat === 0 || beat === 2) {
           notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
        }
        if (beat === 1 || beat === 3) {
           notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }
      });
    } else if (pattern === 'funk') {
      // Funk: Syncopated Kick, Snare 2/4
       [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

        if (beat === 1 || beat === 3) {
           notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }
      });
      // Syncopated Kicks
      notes.push({ id: uuidv4(), time: measureTime, type: DrumType.KICK, hit: false, missed: false, processed: false });
      notes.push({ id: uuidv4(), time: measureTime + beatTime * 2.5, type: DrumType.KICK, hit: false, missed: false, processed: false });
      notes.push({ id: uuidv4(), time: measureTime + beatTime * 3.5, type: DrumType.KICK, hit: false, missed: false, processed: false });
    } else if (pattern === 'jazz') {
        // Swing Ride pattern (1, 2, 2a, 3, 4, 4a)
        [0, 1, 2, 3].forEach(beat => {
            const time = measureTime + beat * beatTime;
            // Ride Cymbal (mapped to Open HH for visual distinctness here or Crash)
            notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_OPEN, hit: false, missed: false, processed: false });
            if (beat === 1 || beat === 3) {
                 // The "a" of the beat in swing
                 notes.push({ id: uuidv4(), time: time + beatTime * 0.66, type: DrumType.HIHAT_OPEN, hit: false, missed: false, processed: false });
                 // Hihat foot on 2 and 4
                 notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
            }
        });
    } else if (pattern === 'pop') {
      // Pop: Very steady, simple, 4 on the floor sometimes or Rock beat
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

        if (beat === 0 || beat === 2) { // Kick 1 & 3
           notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
        }
        if (beat === 1 || beat === 3) { // Snare 2 & 4
           notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }
      });
    } else if (pattern === 'blues') {
      // Blues: Shuffle (Triplets)
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        // Shuffle pattern: 1... a2... a3...
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.66, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

        if (beat === 0 || beat === 2) {
           notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
        }
        if (beat === 1 || beat === 3) {
           notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }
      });
    } else if (pattern === 'metal') {
      // Metal: Fast, Double Kick (16ths)
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        // Fast Hats or Ride
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_OPEN, hit: false, missed: false, processed: false });
        
        // Snare on 3 (Half-time feel) or 2 & 4
        if (beat === 2) {
             notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
             notes.push({ id: uuidv4(), time: time, type: DrumType.CRASH, hit: false, missed: false, processed: false }); // Accent
        }

        // 16th Note Kicks
        notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.25, type: DrumType.KICK, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.5, type: DrumType.KICK, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.75, type: DrumType.KICK, hit: false, missed: false, processed: false });
      });
    } else if (pattern === 'latin') {
      // Bossa Nova-ish
      // Feet pattern: 1, 2a, 3, 4a
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        // Hats constant
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        
        // Rim Click (Snare) - Clave 3-2 (approximation)
        if (i % 2 === 0) { // Bar 1
            if (beat === 0 || beat === 1.5 || beat === 3) 
                 notes.push({ id: uuidv4(), time: time + (beat === 1.5 ? beatTime * 0.5 : 0), type: DrumType.SNARE, hit: false, missed: false, processed: false });
        } else { // Bar 2
             if (beat === 0 || beat === 2)
                 notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }

        // Kick pattern
        notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
        if (beat === 1 || beat === 3) {
             notes.push({ id: uuidv4(), time: time + beatTime * 0.75, type: DrumType.KICK, hit: false, missed: false, processed: false });
        }
      });
    } else if (pattern === 'reggae') {
      // One Drop: Kick & Snare on 3
      [0, 1, 2, 3].forEach(beat => {
        const time = measureTime + beat * beatTime;
        // Shuffle Hats with Accents
        notes.push({ id: uuidv4(), time: time, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
        notes.push({ id: uuidv4(), time: time + beatTime * 0.66, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

        if (beat === 2) { // The "One Drop" (actually beat 3 in 4/4)
            notes.push({ id: uuidv4(), time: time, type: DrumType.KICK, hit: false, missed: false, processed: false });
            notes.push({ id: uuidv4(), time: time, type: DrumType.SNARE, hit: false, missed: false, processed: false });
        }
      });
    }
  }
  return notes.sort((a, b) => a.time - b.time);
};

const STORAGE_KEY = 'jyd_custom_songs';

export const saveCustomSong = (song: Song) => {
  try {
    const existing = getStoredSongs();
    const updated = [...existing, song];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save song", e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("Storage full! Cannot save more songs. Please delete some browser data.");
    }
  }
};

export const getStoredSongs = (): Song[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load songs", e);
    return [];
  }
};

export const getLibrary = (): Song[] => {
  const customSongs = getStoredSongs();
  const defaultSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Backbeat Basics',
      artist: 'The Groovers',
      bpm: 100,
      duration: 60,
      difficulty: 'BEGINNER',
      genre: 'Rock',
      album: 'First Steps',
      year: '2023',
      charter: 'Jack Young',
      notes: generateNotes(100, 25, 'rock')
    },
    {
      id: 'song-2',
      title: 'Funky Chicken',
      artist: 'Pocket Players',
      bpm: 95,
      duration: 60,
      difficulty: 'INTERMEDIATE',
      genre: 'Funk',
      album: 'Greasy Beats',
      year: '1979',
      charter: 'GrooveBot',
      notes: generateNotes(95, 24, 'funk')
    },
    {
      id: 'song-3',
      title: 'Swing City',
      artist: 'Jazz Cats',
      bpm: 140,
      duration: 60,
      difficulty: 'ADVANCED',
      genre: 'Jazz',
      album: 'Blue Note Tribute',
      year: '1959',
      charter: 'SwingKing',
      notes: generateNotes(140, 35, 'jazz')
    },
    {
      id: 'song-4',
      title: 'Radio Pop',
      artist: 'Top 40 Machine',
      bpm: 120,
      duration: 45,
      difficulty: 'BEGINNER',
      genre: 'Pop',
      album: 'Chart Toppers',
      year: '2020',
      charter: 'PopStar',
      notes: generateNotes(120, 20, 'pop')
    },
    {
      id: 'song-5',
      title: 'Delta Blues',
      artist: 'Muddy Waters',
      bpm: 80,
      duration: 60,
      difficulty: 'INTERMEDIATE',
      genre: 'Blues',
      album: 'Swamp Sessions',
      year: '1965',
      charter: 'SlideGuitar',
      notes: generateNotes(80, 20, 'blues')
    },
    {
      id: 'song-6',
      title: 'Thrash Master',
      artist: 'Speed Demons',
      bpm: 180,
      duration: 40,
      difficulty: 'ADVANCED',
      genre: 'Metal',
      album: 'Double Bass Doom',
      year: '1988',
      charter: 'Metalhead',
      notes: generateNotes(180, 30, 'metal')
    },
    {
      id: 'song-7',
      title: 'Ipanema Breeze',
      artist: 'Rio Rhythms',
      bpm: 130,
      duration: 60,
      difficulty: 'INTERMEDIATE',
      genre: 'Latin',
      album: 'Carnival Classics',
      year: '1962',
      charter: 'SambaSoul',
      notes: generateNotes(130, 30, 'latin')
    },
    {
      id: 'song-8',
      title: 'Island Vibes',
      artist: 'Reggae Roots',
      bpm: 90,
      duration: 60,
      difficulty: 'BEGINNER',
      genre: 'Reggae',
      album: 'Kingston Town',
      year: '1975',
      charter: 'JahBeats',
      notes: generateNotes(90, 25, 'reggae')
    }
  ];
  
  return [...defaultSongs, ...customSongs];
};
