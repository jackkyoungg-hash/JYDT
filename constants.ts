import { DrumType, TimingRating } from './types';

// General MIDI Drum Map
export const MIDI_MAP: Record<number, DrumType> = {
  36: DrumType.KICK,
  35: DrumType.KICK,
  38: DrumType.SNARE,
  40: DrumType.SNARE,
  42: DrumType.HIHAT_CLOSED,
  44: DrumType.HIHAT_CLOSED,
  46: DrumType.HIHAT_OPEN,
  49: DrumType.CRASH,
  57: DrumType.CRASH,
  51: DrumType.RIDE,
  59: DrumType.RIDE,
  53: DrumType.RIDE,
  48: DrumType.TOM1,
  50: DrumType.TOM1,
  45: DrumType.TOM2,
  47: DrumType.TOM2,
  43: DrumType.FLOOR_TOM,
  41: DrumType.FLOOR_TOM,
};

export const KEYBOARD_MAP: Record<string, DrumType> = {
  ' ': DrumType.KICK,
  'j': DrumType.SNARE,
  'k': DrumType.HIHAT_CLOSED,
  'l': DrumType.HIHAT_OPEN,
  'f': DrumType.CRASH,
  'r': DrumType.RIDE,
  'u': DrumType.TOM1,
  'i': DrumType.TOM2,
  'o': DrumType.FLOOR_TOM,
};

// Visual Settings
export const NOTE_RADIUS = 10;
export const STAFF_LINE_SPACING = 24;
export const PIXELS_PER_SECOND = 250;
export const PLAYHEAD_X_OFFSET = 200;

// Timing Windows (seconds +/-)
export const TIMING_WINDOWS = {
  [TimingRating.PERFECT]: 0.05,
  [TimingRating.GOOD]: 0.10,
  [TimingRating.OKAY]: 0.15, // This is the max hit window
};

export const HIT_WINDOW = TIMING_WINDOWS[TimingRating.OKAY];

export const RATING_COLORS = {
  [TimingRating.PERFECT]: '#f59e0b', // Amber-500 (Goldish)
  [TimingRating.GOOD]: '#22c55e', // Green-500
  [TimingRating.OKAY]: '#3b82f6', // Blue-500
  [TimingRating.MISS]: '#ef4444', // Red-500
};

export const RATING_SCORES = {
  [TimingRating.PERFECT]: 100,
  [TimingRating.GOOD]: 50,
  [TimingRating.OKAY]: 25,
  [TimingRating.MISS]: 0,
};

// Position mapping: 0 is center line.
// Steps are in half-line increments (10px).
// Top line is -4. Bottom line is 4.
export const DRUM_POSITIONS: Record<DrumType, number> = {
  [DrumType.CRASH]: -6,        // Ledger line above
  [DrumType.RIDE]: -4,         // Top Line (Standard Ride position)
  [DrumType.HIHAT_CLOSED]: -5, // Sits on top of stave (Space above top line)
  [DrumType.HIHAT_OPEN]: -5,   // Same as closed
  [DrumType.TOM1]: -3,         // Top gap (Space 4)
  [DrumType.TOM2]: -2,         // Line 4 (Between Tom 1 and Snare)
  [DrumType.SNARE]: -1,        // Space 3 (Standard Snare position)
  [DrumType.FLOOR_TOM]: 1,     // Space 2
  [DrumType.KICK]: 3,          // Space 1 (Bottom Space)
};