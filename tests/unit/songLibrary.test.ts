import { describe, expect, it, vi } from 'vitest';
import { DrumType, type Song } from '../../types';
import { getLibrary, getStoredSongs, saveCustomSong } from '../../services/songLibrary';

const customSong: Song = {
  id: 'custom-1', title: 'My groove', artist: 'Me', bpm: 120,
  duration: 10, difficulty: 'BEGINNER', genre: 'Custom', category: 'Beats', notes: [],
};

describe('song library', () => {
  it('starts with no stored songs and eight built-in songs', () => {
    expect(getStoredSongs()).toEqual([]);
    expect(getLibrary()).toHaveLength(8);
  });

  it('appends custom songs without replacing earlier songs or built-ins', () => {
    saveCustomSong(customSong);
    const second = { ...customSong, id: 'custom-2', title: 'Second groove' };
    saveCustomSong(second);
    expect(getStoredSongs()).toEqual([customSong, second]);
    expect(getLibrary()).toHaveLength(10);
    expect(getLibrary().slice(-2)).toEqual([customSong, second]);
  });

  it('keeps built-ins available when stored JSON is corrupt', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('jyd_custom_songs', '{broken');
    expect(getStoredSongs()).toEqual([]);
    expect(getLibrary()).toHaveLength(8);
  });

  it('alerts on quota exhaustion and preserves the previous saved songs', () => {
    saveCustomSong(customSong);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    expect(() => saveCustomSong({ ...customSong, id: 'custom-2' })).not.toThrow();
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Storage full'));
    expect(getStoredSongs()).toEqual([customSong]);
  });

  it('generates chronological, unplayed notes with unique IDs for every built-in', () => {
    const songs = getLibrary();
    const ids = songs.flatMap(song => song.notes.map(note => note.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const song of songs) {
      expect(song.notes.length).toBeGreaterThan(0);
      expect(song.notes.map(note => note.time)).toEqual(
        song.notes.map(note => note.time).sort((a, b) => a - b),
      );
      for (const note of song.notes) {
        expect(note.time).toBeGreaterThanOrEqual(0);
        expect(note).toMatchObject({ hit: false, missed: false, processed: false });
        expect(Object.values(DrumType)).toContain(note.type);
      }
    }
  });

  it('places rock kicks on 1/3, snares on 2/4 and hats on eighth notes', () => {
    const rock = getLibrary().find(song => song.id === 'song-1')!;
    const beat = 60 / rock.bpm;
    const firstBar = rock.notes.filter(note => note.time < beat * 4);
    const beatsFor = (type: DrumType) => firstBar.filter(note => note.type === type).map(note => note.time / beat);
    expect(beatsFor(DrumType.KICK)).toEqual([0, 2]);
    expect(beatsFor(DrumType.SNARE)).toEqual([1, 3]);
    beatsFor(DrumType.HIHAT_CLOSED).forEach((time, i) => expect(time).toBeCloseTo(i / 2));
    expect(beatsFor(DrumType.HIHAT_CLOSED)).toHaveLength(8);
  });
});
