import { MIDI_MAP } from '../constants';
import { DrumType } from '../types';

type NoteOnCallback = (type: DrumType, velocity: number) => void;

class MidiService {
  private access: any = null;
  private onNoteOnCallbacks: NoteOnCallback[] = [];
  public connectedDeviceName: string | null = null;

  async initialize(): Promise<boolean> {
    if (!(navigator as any).requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return false;
    }

    try {
      this.access = await (navigator as any).requestMIDIAccess();
      
      // Listen for connection changes
      this.access.onstatechange = (e: any) => {
        console.log('MIDI State Change:', e.port.name, e.port.state);
      };

      // Bind to existing inputs
      this.access.inputs.forEach((input: any) => {
        this.bindInput(input);
      });

      return true;
    } catch (err) {
      console.error('MIDI Access Failed', err);
      return false;
    }
  }

  private bindInput(input: any) {
    this.connectedDeviceName = input.name || 'Unknown Device';
    input.onmidimessage = this.handleMidiMessage.bind(this);
  }

  private handleMidiMessage(event: any) {
    const [command, note, velocity] = event.data;
    
    // Command 144 is Note On (channel 1), 153 is Note On (channel 10 - drums usually)
    // We mask the channel to check just the command type roughly
    const cmdType = command & 0xf0;

    // Note On (usually 0x90 / 144)
    if (cmdType === 0x90 && velocity > 0) {
      const drumType = MIDI_MAP[note];
      if (drumType) {
        this.notifyNoteOn(drumType, velocity);
      } else {
        console.log(`Unmapped MIDI Note: ${note}`);
      }
    }
  }

  public subscribe(callback: NoteOnCallback) {
    this.onNoteOnCallbacks.push(callback);
    return () => {
      this.onNoteOnCallbacks = this.onNoteOnCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyNoteOn(type: DrumType, velocity: number) {
    this.onNoteOnCallbacks.forEach(cb => cb(type, velocity));
  }
}

export const midiService = new MidiService();