import { Song, DrumType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const loadSong = (): Song => {
  const notes: any[] = [];
  const duration = 60; // 1 minute loop
  const bpm = 110;
  const beatTime = 60 / bpm;

  // Simple Rock Beat: Kick on 1 & 3, Snare on 2 & 4, Hi-Hat on 8ths
  for (let i = 0; i < 30; i++) { // 30 measures
    const measureTime = i * (beatTime * 4);
    
    // Beat 1
    notes.push({ id: uuidv4(), time: measureTime, type: DrumType.KICK, hit: false, missed: false, processed: false });
    notes.push({ id: uuidv4(), time: measureTime, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
    
    // Beat 1.5 (and)
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 0.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

    // Beat 2
    notes.push({ id: uuidv4(), time: measureTime + beatTime, type: DrumType.SNARE, hit: false, missed: false, processed: false });
    notes.push({ id: uuidv4(), time: measureTime + beatTime, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

    // Beat 2.5
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 1.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

    // Beat 3
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 2, type: DrumType.KICK, hit: false, missed: false, processed: false });
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 2, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
    
    // Beat 3.5
    // Add a double kick variation sometimes
    if (i % 4 === 3) {
        notes.push({ id: uuidv4(), time: measureTime + beatTime * 2.5, type: DrumType.KICK, hit: false, missed: false, processed: false });
    }
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 2.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });

    // Beat 4
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 3, type: DrumType.SNARE, hit: false, missed: false, processed: false });
    notes.push({ id: uuidv4(), time: measureTime + beatTime * 3, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
    
    // Beat 4.5
    if (i % 8 === 7) {
        notes.push({ id: uuidv4(), time: measureTime + beatTime * 3.5, type: DrumType.HIHAT_OPEN, hit: false, missed: false, processed: false });
    } else {
        notes.push({ id: uuidv4(), time: measureTime + beatTime * 3.5, type: DrumType.HIHAT_CLOSED, hit: false, missed: false, processed: false });
    }
  }

  return {
    id: 'demo-1',
    title: 'Basic Rock Groove',
    artist: 'GrooveMaster',
    bpm,
    duration,
    difficulty: 'BEGINNER',
    genre: 'Rock',
    notes: notes.sort((a, b) => a.time - b.time)
  };
};