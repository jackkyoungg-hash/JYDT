import React from 'react';
import { DrumType, Note, TimingRating } from '../types';
import { DRUM_POSITIONS, STAFF_LINE_SPACING, NOTE_RADIUS, RATING_COLORS } from '../constants';

export interface BeamConfig {
  stemEndY: number; // Absolute Y position in staff space where the stem should end
  beams: {
    width: number;    // Width of the beam to the next note
    isDouble: boolean; // True for 16th note double beaming
  }[];
}

interface DrumNotationProps {
  note: Note;
  relativeTime: number; // Time relative to playhead (0 is now, positive is future)
  pixelsPerSecond: number;
  beamConfig?: BeamConfig;
  showLabel?: boolean;
}

const DRUM_NAMES: Record<DrumType, string> = {
  [DrumType.KICK]: 'Kick',
  [DrumType.SNARE]: 'Snare',
  [DrumType.HIHAT_CLOSED]: 'Hi-Hat',
  [DrumType.HIHAT_OPEN]: 'Open HH',
  [DrumType.CRASH]: 'Crash',
  [DrumType.RIDE]: 'Ride',
  [DrumType.TOM1]: 'High Tom',
  [DrumType.TOM2]: 'Mid Tom',
  [DrumType.FLOOR_TOM]: 'Floor Tom',
};

const DrumNotation: React.FC<DrumNotationProps> = ({ note, relativeTime, pixelsPerSecond, beamConfig, showLabel }) => {
  const x = relativeTime * pixelsPerSecond;
  
  // Center Y is 0. Staff lines are drawn around it.
  // Note Y is relative to center.
  const noteY = (DRUM_POSITIONS[note.type] || 0) * (STAFF_LINE_SPACING / 2);

  // Animation State: Use a ref to track when the hit occurred in real-time
  const hitTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!note.hit) hitTimeRef.current = 0;
  }, [note.hit]);

  if (note.hit && hitTimeRef.current === 0) {
    hitTimeRef.current = Date.now();
  }

  const animTime = (note.hit && hitTimeRef.current > 0) 
    ? (Date.now() - hitTimeRef.current) / 1000 
    : 0;

  // Visual State Calculations
  let color = 'black';
  let opacity = 1;
  let scale = 1;
  let filter = 'none';
  let isHollow = false;
  let flashColor = null;

  if (note.hit && note.rating) {
    const baseColor = RATING_COLORS[note.rating];
    color = baseColor;
    
    // Flash white on impact (first 50ms)
    if (animTime < 0.05) {
        flashColor = '#ffffff';
    }

    // Slightly reduced glow
    filter = `drop-shadow(0 0 4px ${baseColor})`;
    
    // Dynamic Scale Animation: Pop big then settle
    // We scale around (0,0) which is the note head center.
    scale = 1 + (0.35 * Math.exp(-15 * animTime));

  } else if (note.missed) {
    color = RATING_COLORS[TimingRating.MISS];
    opacity = 0.5; // Visible enough to see it's a note, but clearly "ghosted"
    isHollow = true; // Hollow out the note head
    filter = 'grayscale(0.5)'; // Desaturate slightly
  }

  // Use flash color if active, otherwise base color
  const renderColor = flashColor || color;

  // Ripple Animation Logic (only active shortly after hit)
  const showRipple = note.hit && animTime < 0.5;
  const rippleRadius = NOTE_RADIUS + (animTime * 100); // Expands outwards
  const rippleOpacity = Math.max(0, 0.8 - (animTime * 2)); // Fades out

  // Voice / Stem Logic
  const isFeet = [DrumType.KICK].includes(note.type); // Add HH Pedal here if needed
  const isStemUp = !isFeet;

  // Relaxed Text Colors
  const TEXT_COLORS = {
    [TimingRating.PERFECT]: '#d97706', // Amber-600
    [TimingRating.GOOD]: '#15803d',    // Green-700
    [TimingRating.OKAY]: '#1d4ed8',    // Blue-700
    [TimingRating.MISS]: '#b91c1c',    // Red-700
  };

  const renderLedgerLines = () => {
    // Staff limits in 'pos' units (steps of 10px): Top line is -4, Bottom line is 4.
    // noteY is already in pixels. 
    // Calculate pos index from noteY.
    const pos = Math.round(noteY / (STAFF_LINE_SPACING / 2));
    
    // If inside staff (or in the space just outside), no ledger lines.
    // Spaces outside are -5 and 5. Ledger lines start at -6 and 6.
    if (Math.abs(pos) < 6) return null;

    const lines = [];
    
    // Top Ledger Lines (Negative pos)
    if (pos <= -6) {
        // Iterate from first ledger line (-6) upwards to the note position
        // Ensure we hit every even number
        for (let p = -6; p >= pos; p -= 2) {
             lines.push(p);
        }
        // If note is in a space (e.g. -7), we still need the line at -6.
        // The loop above handles this: if pos is -7, loop runs for -6.
        // If pos is -6, loop runs for -6.
    }
    
    // Bottom Ledger Lines (Positive pos)
    if (pos >= 6) {
        for (let p = 6; p <= pos; p += 2) {
            lines.push(p);
        }
    }

    return (
        <g>
            {lines.map(p => (
                <line 
                    key={p} 
                    x1={-16} 
                    y1={p * (STAFF_LINE_SPACING / 2)} 
                    x2={16} 
                    y2={p * (STAFF_LINE_SPACING / 2)} 
                    stroke="black" // Ledger lines are always black/dark gray, not colored by hit
                    strokeWidth="2" 
                    opacity={opacity} 
                />
            ))}
        </g>
    );
  };

  // Symbol Rendering
  const renderSymbol = () => {
    const xSize = NOTE_RADIUS * 0.7;
    const strokeWidth = 2.5; // Thinner lines for smaller scale
    
    switch (note.type) {
      case DrumType.HIHAT_CLOSED:
      case DrumType.HIHAT_OPEN:
      case DrumType.CRASH:
      case DrumType.RIDE:
        return (
          <g stroke={renderColor} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap="round">
            <line x1={-xSize} y1={-xSize} x2={xSize} y2={xSize} />
            <line x1={-xSize} y1={xSize} x2={xSize} y2={-xSize} />
            {note.type === DrumType.HIHAT_OPEN && (
              <circle cx={0} cy={-NOTE_RADIUS} r={NOTE_RADIUS * 0.35} stroke={renderColor} fill="none" strokeWidth="2" />
            )}
          </g>
        );
      
      case DrumType.KICK:
        return (
          <ellipse 
            cx={0} cy={0} 
            rx={NOTE_RADIUS} ry={NOTE_RADIUS * 0.75} 
            fill={isHollow ? 'transparent' : renderColor} 
            stroke={isHollow ? renderColor : 'none'}
            strokeWidth={isHollow ? 2 : 0}
            opacity={opacity}
          />
        );
        
      default: // Snare, Toms
        return (
           <ellipse 
            cx={0} cy={0} 
            rx={NOTE_RADIUS} ry={NOTE_RADIUS * 0.75} 
            fill={isHollow ? 'transparent' : renderColor} 
            stroke={isHollow ? renderColor : 'none'}
            strokeWidth={isHollow ? 2 : 0}
            opacity={opacity}
            transform="rotate(-20)" // Standard drum notation tilt
          />
        );
    }
  };

  const renderStemAndBeams = () => {
    // Drum Notation Standard Convention:
    // Hands (Cymbals, Snare, Toms) = Stems Up
    // Feet (Kick, HH Pedal) = Stems Down
    
    // Determine attachment point X based on note head shape
    // Cymbals (X) are narrower than Drums (Ellipse)
    const isCymbal = [DrumType.HIHAT_CLOSED, DrumType.HIHAT_OPEN, DrumType.CRASH, DrumType.RIDE].includes(note.type);
    
    // If Stem Up -> Attach Right side. If Stem Down -> Attach Left side.
    let attachX = 0;
    if (isCymbal) {
        attachX = isStemUp ? (NOTE_RADIUS * 0.6) : -(NOTE_RADIUS * 0.6);
    } else {
        // Ellipse radius is NOTE_RADIUS, attach slightly inside
        // With rotation, the "right side" is a bit different, but this approximation works
        attachX = isStemUp ? (NOTE_RADIUS * 0.8) : -(NOTE_RADIUS * 0.8);
    }

    // Calculate Stem Length
    // If we have a beam config, extend to that Y.
    // Otherwise use default length proportional to staff spacing
    const defaultStemLength = STAFF_LINE_SPACING * 2.5;
    let localStemEndY = isStemUp ? -defaultStemLength : defaultStemLength; // Default

    if (beamConfig) {
      // transform from absolute staff Y to local Y (relative to note head)
      localStemEndY = beamConfig.stemEndY - noteY;
    }

    const stemWidth = 2.5; // Thinner stems for smaller scale

    return (
      <g>
        {/* Vertical Stem */}
        <line 
          x1={attachX} 
          y1={0} 
          x2={attachX} 
          y2={localStemEndY} 
          stroke={renderColor} 
          strokeWidth={stemWidth}
          opacity={opacity}
          strokeLinecap="round"
        />

        {/* Beams */}
        {beamConfig && beamConfig.beams.map((beam, idx) => {
            if (beam.width <= 0) return null; // Simultaneous notes (chords) don't beam horizontally

            // Primary beam (8th) is always at the tip (localStemEndY)
            // Secondary beam (16th) is shifted "inward" towards the note head
            const beamThickness = STAFF_LINE_SPACING * 0.25; // Thinner beams for smaller scale
            const beamSpacing = STAFF_LINE_SPACING * 0.4; 

            // Calculate Y offset for this specific beam line
            // If Stem Up: 16th beam is BELOW the 8th beam (positive Y offset)
            // If Stem Down: 16th beam is ABOVE the 8th beam (negative Y offset)
            let yOffset = 0;
            if (beam.isDouble) {
               // This is the inner beam
               yOffset = isStemUp ? beamSpacing : -beamSpacing;
            }

            return (
              <line
                key={idx}
                x1={attachX}
                y1={localStemEndY + yOffset}
                x2={attachX + beam.width} // Extend to right
                y2={localStemEndY + yOffset} // Horizontal beams for now
                stroke={renderColor}
                strokeWidth={beamThickness}
                opacity={opacity}
                strokeLinecap="butt" // Sharp edges for beams
              />
            );
        })}
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${noteY})`}>
      {/* Ripple Effect for Hits */}
      {showRipple && (
        <circle 
          cx={0} cy={0} 
          r={rippleRadius} 
          stroke={color} 
          strokeWidth={2} 
          fill="none" 
          opacity={rippleOpacity}
        />
      )}
      
      {/* Ledger Lines (Drawn behind the note symbol) */}
      <g transform={`scale(${scale})`}>
          {renderLedgerLines()}
      </g>

      {/* Main Note Group with Transforms */}
      <g transform={`scale(${scale})`} style={{ filter, transition: 'filter 0.1s' }}>
        {renderStemAndBeams()}
        {renderSymbol()}
      </g>

      {/* Helper Label for Wait Mode */}
      {showLabel && (
        <text
          x={20}
          y={4}
          fill="#4f46e5" // Indigo-600
          fontWeight="bold"
          fontSize="12"
          className="font-sans animate-pulse"
          style={{ pointerEvents: 'none' }}
        >
          {DRUM_NAMES[note.type]}
        </text>
      )}
      
      {/* Rating Text Popup - Fixed position above/below note */}
      {note.hit && animTime < 0.6 && (
          <text 
            y={isStemUp ? -60 : 40} 
            fill={TEXT_COLORS[note.rating!] || color}
            stroke="white"
            strokeWidth="3"
            strokeLinejoin="round"
            paintOrder="stroke"
            fontWeight="800"
            fontSize="14"
            textAnchor="middle"
            className="font-display uppercase tracking-wider"
            style={{ 
                opacity: Math.max(0, 1 - (animTime * 1.5)), 
            }}
          >
            {note.rating}
          </text>
      )}
    </g>
  );
};

export default React.memo(DrumNotation);