import { beforeEach, vi } from 'vitest';

// Only the browser APIs used by these services; no DOM emulator is needed.
beforeEach(() => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('alert', vi.fn());
});
