
export enum DrumType {
  KICK = 'KICK',
  SNARE = 'SNARE',
  HIHAT_CLOSED = 'HIHAT_CLOSED',
  HIHAT_OPEN = 'HIHAT_OPEN',
  CRASH = 'CRASH',
  RIDE = 'RIDE',
  TOM1 = 'TOM1',
  TOM2 = 'TOM2',
  FLOOR_TOM = 'FLOOR_TOM'
}

export enum TimingRating {
  PERFECT = 'PERFECT',
  GOOD = 'GOOD',
  OKAY = 'OKAY',
  MISS = 'MISS'
}

export interface Note {
  id: string;
  time: number; // in seconds
  type: DrumType;
  hit: boolean;
  missed: boolean;
  processed: boolean;
  rating?: TimingRating;
  timeOffset?: number; // How far off the hit was in seconds
}

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: Difficulty;
  genre: string;
  notes: Note[];
  // Metadata for Library UI
  album?: string;
  year?: string;
  charter?: string;
  category?: string; // e.g., 'Exercises', 'Rudiments', 'Beats'
  audioUrl?: string; // Data URL or Blob URL for backing track
}

export interface GameState {
  screen: 'MENU' | 'LIBRARY' | 'STAGE' | 'RESULTS' | 'PRACTICE' | 'SETTINGS';
  isPlaying: boolean;
  isPaused: boolean;
}

export interface ScoreState {
  score: number;
  streak: number;
  maxStreak: number;
  hits: number;
  misses: number;
  perfects: number;
  goods: number;
  okays: number;
  usedWaitMode: boolean;
}

export interface PracticeConfig {
  active: boolean;
  playbackSpeed: number;
  loopStart: number;
  loopEnd: number;
  waitMode: boolean; // Synthesia-style waiting
}
