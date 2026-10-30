import { describe, expect, it, vi } from 'vitest';
import { KEYBOARD_MAP } from '../../constants';
import { DrumType } from '../../types';
import { getKeyboardMap, resetKeyboardMap, saveKeyboardMap } from '../../services/inputService';

describe('keyboard settings', () => {
  it('returns independent defaults when nothing is saved', () => {
    const map = getKeyboardMap();
    expect(map).toEqual(KEYBOARD_MAP);
    map.j = DrumType.KICK;
    expect(getKeyboardMap().j).toBe(DrumType.SNARE);
  });

  it('round-trips custom mappings, including the space key', () => {
    const map = { ' ': DrumType.KICK, x: DrumType.SNARE };
    saveKeyboardMap(map);
    expect(getKeyboardMap()).toEqual(map);
  });

  it('resets only keyboard settings and returns a fresh default map', () => {
    localStorage.setItem('jyd_custom_songs', '[]');
    saveKeyboardMap({ x: DrumType.SNARE });
    const defaults = resetKeyboardMap();
    expect(localStorage.getItem('jyd_keyboard_map')).toBeNull();
    expect(localStorage.getItem('jyd_custom_songs')).toBe('[]');
    expect(defaults).toEqual(KEYBOARD_MAP);
    expect(defaults).not.toBe(KEYBOARD_MAP);
  });

  it('falls back to defaults for malformed saved JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('jyd_keyboard_map', '{broken');
    expect(getKeyboardMap()).toEqual(KEYBOARD_MAP);
  });

  it('keeps defaults usable when storage access is denied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    expect(getKeyboardMap()).toEqual(KEYBOARD_MAP);
  });

  it('does not throw when saving is denied', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    expect(() => saveKeyboardMap({ x: DrumType.SNARE })).not.toThrow();
  });
});
