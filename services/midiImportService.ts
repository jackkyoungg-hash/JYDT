import { Midi } from '@tonejs/midi';
import { v4 as uuidv4 } from 'uuid';
import { Song, Note, DrumType } from '../types';
import { MIDI_MAP } from '../constants';

export const importMidiSong = async (midiFile: File, category?: string, audioFile?: File): Promise<Song> => {
  const arrayBuffer = await midiFile.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  const notes: Note[] = [];
  
  // Iterate through all tracks to find drum notes
  // We collect valid drum notes from all tracks to support various MIDI formats (Type 0/1)
  midi.tracks.forEach(track => {
    track.notes.forEach(note => {
      // Check if this MIDI note maps to a known DrumType
      const drumType = MIDI_MAP[note.midi];
      if (drumType) {
        notes.push({
          id: uuidv4(),
          time: note.time,
          type: drumType,
          hit: false,
          missed: false,
          processed: false,
          rating: undefined
        });
      }
    });
  });

  // Sort notes chronologically
  notes.sort((a, b) => a.time - b.time);

  // Heuristic for difficulty based on notes per second (NPS)
  const duration = midi.duration || 60;
  const notesPerSecond = notes.length > 0 ? notes.length / duration : 0;
  
  let difficulty: Song['difficulty'] = 'BEGINNER';
  if (notesPerSecond > 4) difficulty = 'ADVANCED';
  else if (notesPerSecond > 2.5) difficulty = 'INTERMEDIATE';

  // Get BPM from the first tempo event, default to 120
  const bpm = Math.round(midi.header.tempos[0]?.bpm || 120);

  let audioUrl: string | undefined;
  if (audioFile) {
    // Read audio file as Data URL for storage/playback
    // Note: Large files might fail localStorage limits
    audioUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
    });
  }

  return {
    id: uuidv4(),
    title: midiFile.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
    artist: 'Imported MIDI',
    bpm: bpm,
    duration: duration,
    difficulty: difficulty,
    genre: 'Custom',
    notes: notes,
    category: category || 'Songs',
    audioUrl: audioUrl
  };
};