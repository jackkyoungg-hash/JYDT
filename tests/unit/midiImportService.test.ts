import { Midi } from '@tonejs/midi';
import { describe, expect, it } from 'vitest';
import { importMidiSong } from '../../services/midiImportService';
import { DrumType } from '../../types';

// Serialize real MIDI bytes so parsing, timing and mapping are exercised together.
const fileFor = (midi: Midi, name = 'My.groove.mid') =>
  new File([Uint8Array.from(midi.toArray())], name, { type: 'audio/midi' });

describe('MIDI import', () => {
  it('merges tracks, ignores unmapped pitches and sorts mapped drum notes', async () => {
    const midi = new Midi();
    midi.header.setTempo(120);
    midi.addTrack().addNote({ midi: 36, time: 2, duration: 0.25 });
    midi.addTrack()
      .addNote({ midi: 38, time: 0.5, duration: 0.25 })
      .addNote({ midi: 60, time: 1, duration: 0.25 });
    const song = await importMidiSong(fileFor(midi), 'Exercises');
    expect(song).toMatchObject({
      title: 'My.groove', artist: 'Imported MIDI', bpm: 120,
      duration: 2.25, difficulty: 'BEGINNER', genre: 'Custom', category: 'Exercises',
    });
    expect(song.notes.map(note => [note.type, note.time])).toEqual([
      [DrumType.SNARE, 0.5], [DrumType.KICK, 2],
    ]);
    expect(new Set([song.id, ...song.notes.map(note => note.id)]).size).toBe(3);
    for (const note of song.notes) {
      expect(note).toMatchObject({ hit: false, missed: false, processed: false });
    }
  });

  it('uses default tempo, duration and category for a MIDI with an empty track', async () => {
    const midi = new Midi();
    midi.addTrack();
    const song = await importMidiSong(fileFor(midi));
    expect(song).toMatchObject({ bpm: 120, duration: 60, category: 'Songs', notes: [], difficulty: 'BEGINNER' });
    expect(song.audioUrl).toBeUndefined();
  });

  // Existing parser edge case: a file with no tracks has duration -Infinity.
  // Keep the desired behavior visible without changing production logic here.
  it.fails('uses a finite fallback duration for a MIDI with no tracks (known bug)', async () => {
    expect((await importMidiSong(fileFor(new Midi()))).duration).toBe(60);
  });

  it('rounds the initial tempo for display', async () => {
    const midi = new Midi();
    midi.header.setTempo(123.4);
    expect((await importMidiSong(fileFor(midi))).bpm).toBe(123);
  });

  it.each([
    [25, 'BEGINNER'], [26, 'INTERMEDIATE'], [40, 'INTERMEDIATE'], [41, 'ADVANCED'],
  ] as const)('classifies %i notes in ten seconds as %s', async (count, difficulty) => {
    const midi = new Midi();
    midi.header.setTempo(120);
    const track = midi.addTrack();
    const endTicks = midi.header.ppq * 20; // Ten seconds at 120 BPM.
    for (let i = 0; i < count; i++) {
      const ticks = i * 120;
      track.addNote({ midi: 42, ticks, durationTicks: i === count - 1 ? endTicks - ticks : 120 });
    }
    const song = await importMidiSong(fileFor(midi));
    expect(song.duration).toBe(10);
    expect(song.notes).toHaveLength(count);
    expect(song.difficulty).toBe(difficulty);
  });

  it('rejects invalid MIDI instead of creating a song', async () => {
    await expect(importMidiSong(new File(['invalid MIDI'], 'broken.mid'))).rejects.toBeDefined();
  });
});
