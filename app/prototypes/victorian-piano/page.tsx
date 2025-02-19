'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './styles.module.css';

// Piano note frequencies (full range)
const NOTES: { [key: string]: number } = {};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Generate frequencies for all notes
for (let octave = 0; octave <= 8; octave++) {
  NOTE_NAMES.forEach(note => {
    // Only generate notes from A0 to C8
    const noteWithOctave = `${note}${octave}`;
    if (
      (octave === 0 && NOTE_NAMES.indexOf(note) >= NOTE_NAMES.indexOf('A')) || // A0 and above
      (octave > 0 && octave < 7) || // All notes in octaves 1-6
      (octave === 7 && NOTE_NAMES.indexOf(note) <= NOTE_NAMES.indexOf('C')) // Up to C8
    ) {
      // A4 is 440Hz, calculate other frequencies relative to A4
      const semitonesFromA4 = (octave - 4) * 12 + NOTE_NAMES.indexOf(note) - NOTE_NAMES.indexOf('A');
      NOTES[noteWithOctave] = 440 * Math.pow(2, semitonesFromA4 / 12);
    }
  });
}

// Keyboard mapping for computer keyboard (we'll map a subset of keys since we can't map all piano keys)
const KEY_TO_NOTE = {
  // Lower octave
  'z': 'C3',
  's': 'C#3',
  'x': 'D3',
  'd': 'D#3',
  'c': 'E3',
  'v': 'F3',
  'g': 'F#3',
  'b': 'G3',
  'h': 'G#3',
  'n': 'A3',
  'j': 'A#3',
  'm': 'B3',
  // Middle octave
  ',': 'C4',
  'l': 'C#4',
  '.': 'D4',
  ';': 'D#4',
  '/': 'E4',
  'q': 'F4',
  '2': 'F#4',
  'w': 'G4',
  '3': 'G#4',
  'e': 'A4',
  '4': 'A#4',
  'r': 'B4',
  // Upper octave
  't': 'C5',
  '6': 'C#5',
  'y': 'D5',
  '7': 'D#5',
  'u': 'E5',
  'i': 'F5',
  '9': 'F#5',
  'o': 'G5',
  '0': 'G#5',
  'p': 'A5',
  '-': 'A#5',
  '[': 'B5',
  ']': 'C6'
};

// Add this after the KEY_TO_NOTE constant
const FUR_ELISE_NOTES = [
  // Main theme
  { note: 'E4', duration: 0.25 },
  { note: 'D#4', duration: 0.25 },
  { note: 'E4', duration: 0.25 },
  { note: 'D#4', duration: 0.25 },
  { note: 'E4', duration: 0.25 },
  { note: 'B3', duration: 0.25 },
  { note: 'D4', duration: 0.25 },
  { note: 'C4', duration: 0.25 },
  { note: 'A3', duration: 0.5 },
  // Pause
  { note: '', duration: 0.25 },
  // Bass notes and continuation
  { note: 'C3', duration: 0.25 },
  { note: 'E3', duration: 0.25 },
  { note: 'A3', duration: 0.25 },
  { note: 'B3', duration: 0.5 },
  // Pause
  { note: '', duration: 0.25 },
  { note: 'E3', duration: 0.25 },
  { note: 'G#3', duration: 0.25 },
  { note: 'B3', duration: 0.25 },
  { note: 'C4', duration: 0.5 },
  // Repeat main theme
  { note: 'E4', duration: 0.25 },
  { note: 'D#4', duration: 0.25 },
  { note: 'E4', duration: 0.25 },
  { note: 'D#4', duration: 0.25 },
  { note: 'E4', duration: 0.25 },
  { note: 'B3', duration: 0.25 },
  { note: 'D4', duration: 0.25 },
  { note: 'C4', duration: 0.25 },
  { note: 'A3', duration: 0.5 },
];

export default function VictorianPiano() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [oscillators, setOscillators] = useState<{ [key: string]: { osc: OscillatorNode; gainNode: GainNode } }>({});
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);

    const handleKeyDown = (e: KeyboardEvent) => {
      const note = KEY_TO_NOTE[e.key as keyof typeof KEY_TO_NOTE];
      if (note && !activeNotes.has(note) && audioContext) {
        playNote(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = KEY_TO_NOTE[e.key as keyof typeof KEY_TO_NOTE];
      if (note) {
        stopNote(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeNotes]);

  const playNote = (note: string, duration?: number) => {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(NOTES[note as keyof typeof NOTES], now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
    
    if (duration) {
      // If duration is provided, schedule the note to stop automatically
      gainNode.gain.setValueAtTime(0.5, now + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
      setTimeout(() => {
        osc.stop(now + duration);
        osc.disconnect();
        gainNode.disconnect();
      }, duration * 1000);
    }
    
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc.start(now);
    setOscillators(prev => ({ ...prev, [note]: { osc, gainNode } }));
    setActiveNotes(prev => new Set(prev).add(note));

    return { osc, gainNode };
  };

  const stopNote = (note: string) => {
    const oscillator = oscillators[note];
    if (oscillator) {
      const { osc, gainNode } = oscillator;
      const now = audioContext?.currentTime || 0;
      
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
      
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gainNode.disconnect();
      }, 50);
      
      setOscillators(prev => {
        const newOsc = { ...prev };
        delete newOsc[note];
        return newOsc;
      });
      setActiveNotes(prev => {
        const newNotes = new Set(prev);
        newNotes.delete(note);
        return newNotes;
      });
    }
  };

  const playFurElise = async () => {
    if (!audioContext || isPlaying) return;
    
    setIsPlaying(true);
    const startTime = audioContext.currentTime;
    let currentTime = 0;
    
    for (const { note, duration } of FUR_ELISE_NOTES) {
      if (note) {
        playNote(note, duration);
      }
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      currentTime += duration;
    }
    
    setIsPlaying(false);
  };

  const renderPianoKey = (note: string, isBlack: boolean, leftOffset?: string) => {
    const isActive = activeNotes.has(note);
    const keyClass = isBlack ? styles.blackKey : styles.whiteKey;
    const activeClass = isActive ? styles.active : '';
    const style = leftOffset !== undefined ? { 
      left: leftOffset,
      transform: 'translateX(-50%)',
      top: '10px'
    } : {};

    const key = (
      <div
        key={note}
        className={`${keyClass} ${activeClass}`}
        style={style}
        onMouseDown={() => playNote(note)}
        onMouseUp={() => stopNote(note)}
        onMouseLeave={() => stopNote(note)}
      />
    );

    return isBlack ? (
      <div key={`wrapper-${note}`} className={styles.blackKeyWrapper}>
        {key}
      </div>
    ) : key;
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Victorian Piano</h1>
        
        <div className={styles.pianoContainer}>
          <div className={styles.pianoBody}>
            <div className={styles.keyboard}>
              {/* Generate all white keys */}
              {Array.from({ length: 52 }, (_, i) => {
                const octave = Math.floor(i / 7) + 1;
                const noteIndex = i % 7;
                const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
                const note = `${notes[noteIndex]}${octave}`;
                // Only render if the note is within A0 to C8 range
                if (NOTES[note]) {
                  return renderPianoKey(note, false);
                }
                return null;
              })}
              
              {/* Generate all black keys */}
              {Array.from({ length: 36 }, (_, i) => {
                const octave = Math.floor(i / 5) + 1;
                const noteIndex = i % 5;
                const notes = ['C#', 'D#', 'F#', 'G#', 'A#'];
                const note = `${notes[noteIndex]}${octave}`;
                
                // Only render if the note is within A0 to C8 range
                if (!NOTES[note]) return null;

                // Calculate position based on white keys
                const whiteKeyGroup = Math.floor(i / 5) * 7;
                
                // Calculate the position relative to the white keys
                // Each black key is positioned between two white keys
                const whiteKeyWidth = 100 / 52; // Width of one white key in percentage
                let position;
                switch (noteIndex) {
                  case 0: // C#
                    position = whiteKeyGroup * whiteKeyWidth + whiteKeyWidth * 0.7;
                    break;
                  case 1: // D#
                    position = whiteKeyGroup * whiteKeyWidth + whiteKeyWidth * 1.7;
                    break;
                  case 2: // F#
                    position = whiteKeyGroup * whiteKeyWidth + whiteKeyWidth * 3.7;
                    break;
                  case 3: // G#
                    position = whiteKeyGroup * whiteKeyWidth + whiteKeyWidth * 4.7;
                    break;
                  case 4: // A#
                    position = whiteKeyGroup * whiteKeyWidth + whiteKeyWidth * 5.7;
                    break;
                  default:
                    position = whiteKeyGroup * whiteKeyWidth;
                }
                
                const leftPosition = `${position}%`;
                
                return renderPianoKey(note, true, leftPosition);
              })}
            </div>
          </div>
          <button 
            className={styles.playButton}
            onClick={playFurElise}
            disabled={isPlaying}
          >
            {isPlaying ? 'Playing Für Elise...' : 'Play Für Elise'}
          </button>
        </div>

        <div className={styles.instructions}>
          <p>Click or use your keyboard to play the piano:</p>
          <p>First octave: Z X C V B N M</p>
          <p>Second octave: , . / Q W E R</p>
          <p>Third octave: T Y U I O P [ ]</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.backLink}>← Back to prototypes</Link>
      </footer>
    </div>
  );
} 