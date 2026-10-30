import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrumType } from '../../types';

describe('MIDI device input', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reports unsupported browsers without requesting a device', async () => {
    vi.stubGlobal('navigator', {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { midiService } = await import('../../services/midiService');
    expect(await midiService.initialize()).toBe(false);
  });

  it('handles denied MIDI permission', async () => {
    vi.stubGlobal('navigator', { requestMIDIAccess: vi.fn().mockRejectedValue(new Error('Denied')) });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { midiService } = await import('../../services/midiService');
    expect(await midiService.initialize()).toBe(false);
  });

  it('delivers note-on events across channels, ignores note-off/zero velocity/unmapped notes, and unsubscribes', async () => {
    const input = { name: 'Test drum kit', onmidimessage: null as null | ((event: { data: number[] }) => void) };
    vi.stubGlobal('navigator', {
      requestMIDIAccess: vi.fn().mockResolvedValue({ inputs: new Map([['kit', input]]) }),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { midiService } = await import('../../services/midiService');
    const callback = vi.fn();
    const unsubscribe = midiService.subscribe(callback);
    expect(await midiService.initialize()).toBe(true);
    expect(midiService.connectedDeviceName).toBe('Test drum kit');
    const send = (data: number[]) => input.onmidimessage!({ data });
    send([0x90, 36, 100]);
    send([0x99, 38, 80]);
    expect(callback.mock.calls).toEqual([[DrumType.KICK, 100], [DrumType.SNARE, 80]]);
    send([0x80, 36, 100]);
    send([0x90, 36, 0]);
    send([0x99, 60, 100]);
    unsubscribe();
    send([0x99, 38, 100]);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
