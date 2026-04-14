import { DrumType } from '../types';
import { KEYBOARD_MAP as DEFAULT_KEYBOARD_MAP } from '../constants';

const STORAGE_KEY = 'jyd_keyboard_map';

export const getKeyboardMap = (): Record<string, DrumType> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load keyboard map", e);
  }
  return { ...DEFAULT_KEYBOARD_MAP };
};

export const saveKeyboardMap = (map: Record<string, DrumType>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save keyboard map", e);
  }
};

export const resetKeyboardMap = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_KEYBOARD_MAP };
};
