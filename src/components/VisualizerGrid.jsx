import { useRef, useEffect, useState } from 'react';

const TILE_SIZE = 16;
const TILE_MARGIN = 2;
const VISIBLE_SIZE = TILE_SIZE - TILE_MARGIN * 1;

const COLORS = {
  bass: '#5EEAD4',
  mid: '#8B5CF6',
  treble: '#F97316',
  accent1: '#F59E0B',
  accent2: '#EF4444',
  accent3: '#10B981',
};

function VisualizerGrid({ audioCtx, analyser, isPlaying }) {
  const canvasRef = useRef();
  const containerRef = useRef();
  const shapesRef = useRef([]);
  const animationIdRef = useRef();
  const [grid, setGrid] = useState({ cols: 20, rows: 20 });
  
  // Beat detection state
  const beatDetectionRef = useRef({
    bassHistory: [],
    midHistory: [],
    trebleHistory: [],
    lastBeatTime: 0,
    beatThreshold: 1.3,
    bpm: 120, // Default BPM
    beatStrength: 0,
    kickDetected: false,
    snareDetected: false,
    hihatDetected: false,
    energySpikes: { bass: 0, mid: 0, treble: 0 }
  });

  // Initialize shapes and handle resize
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cols = Math.floor(width / TILE_SIZE);
      const rows = Math.floor(height / TILE_SIZE);
      setGrid({ cols, rows });
      
      if (shapesRef.current.length > 0) {
        shapesRef.current.forEach(shape => {
          shape.x = Math.min(shape.x, cols - 1);
          shape.y = Math.min(shape.y, rows - 1);
          
          const screenScale = Math.min(width / 800, height / 600);
          shape.screenScale = Math.max(0.5, Math.min(2, screenScale));
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Create shapes when grid changes
  useEffect(() => {
    const { cols, rows } = grid;
    if (cols <= 0 || rows <= 0) return;

    const area = cols * rows;
    const shapeCount = Math.max(6, Math.min(20, Math.floor(area / 100)));
    const allColors = Object.keys(COLORS);

    shapesRef.current = Array.from({ length: shapeCount }).map((_, i) => {
      const colorKey = allColors[i % allColors.length];
      return {
        type: ['circle', 'square', 'triangle', 'hexagon'][i % 4],
        x: Math.random() * cols,
        y: Math.random() * rows,
        dx: (Math.random() - 0.5) * 0.03,
        dy: (Math.random() - 0.5) * 0.03,
        baseSize: 12 + Math.random() * 15,
        maxSize: 25 + Math.random() * 20,
        band: ['bass', 'mid', 'treble'][i % 3],
        color: COLORS[colorKey],
        offset: Math.random() * 1000,
        energy: 0,
        targetEnergy: 0,
        screenScale: 1,
        intensity: 0.5 + Math.random() * 0.5,
        // Tempo-based properties
        beatResponse: Math.random() * 0.5 + 0.5, // How much this shape responds to beats
        tempoMultiplier: Math.random() * 0.8 + 0.6, // Individual tempo sensitivity
        lastBeatBoost: 0, // For beat-based size boosts
        rhythmOffset: Math.random() * Math.PI * 2, // Phase offset for rhythm
        danceIntensity: 0, // Current dance movement intensity
        baseDirection: { x: Math.random() - 0.5, y: Math.random() - 0.5 }, // Preferred movement direction
      };
    });
    console.log('Created', shapesRef.current.length, 'tempo-reactive shapes for grid', cols, 'x', rows);
  }, [grid]);

  // Beat detection function
  const detectBeats = (bass, mid, treble) => {
    const detection = beatDetectionRef.current;
    const now = performance.now();
    
    // Keep history of energy levels
    detection.bassHistory.push(bass);
    detection.midHistory.push(mid);
    detection.trebleHistory.push(treble);
    
    // Keep only last 60 frames (1 second at 60fps)
    if (detection.bassHistory.length > 60) {
      detection.bassHistory.shift();
      detection.midHistory.shift();
      detection.trebleHistory.shift();
    }
    
    if (detection.bassHistory.length < 10) return; // Need some history
    
    // Calculate averages
    const bassAvg = detection.bassHistory.reduce((a, b) => a + b) / detection.bassHistory.length;
    const midAvg = detection.midHistory.reduce((a, b) => a + b) / detection.midHistory.length;
    const trebleAvg = detection.trebleHistory.reduce((a, b) => a + b) / detection.trebleHistory.length;
    
    // Detect kicks (bass drum) - strong bass energy
    const bassRatio = bass / (bassAvg + 1);
    if (bassRatio > detection.beatThreshold && now - detection.lastBeatTime > 200) {
      detection.kickDetected = true;
      detection.lastBeatTime = now;
      detection.beatStrength = Math.min(1, (bassRatio - 1) * 2);
      
      // Estimate BPM based on beat intervals
      const timeSinceLastBeat = now - detection.lastBeatTime;
      if (timeSinceLastBeat > 0) {
        const instantBPM = 60000 / timeSinceLastBeat;
        if (instantBPM > 60 && instantBPM < 200) {
          detection.bpm = detection.bpm * 0.9 + instantBPM * 0.1; // Smooth BPM
        }
      }
    } else {
      detection.kickDetected = false;
    }
    
    // Detect snare (mid frequencies)
    const midRatio = mid / (midAvg + 1);
    detection.snareDetected = midRatio > detection.beatThreshold;
    
    // Detect hi-hats (treble frequencies)
    const trebleRatio = treble / (trebleAvg + 1);
    detection.hihatDetected = trebleRatio > detection.beatThreshold;
    
    // Calculate energy spikes for continuous movement
    detection.energySpikes.bass = Math.max(0, bassRatio - 1);
    detection.energySpikes.mid = Math.max(0, midRatio - 1);
    detection.energySpikes.treble = Math.max(0, trebleRatio - 1);
    
    // Decay beat strength
    detection.beatStrength *= 0.95;
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    console.log('Starting tempo-reactive visualizer animation');

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      frameCount++;

      const { cols, rows } = grid;
      if (cols <= 0 || rows <= 0) return;

      const CANVAS_WIDTH = cols * TILE_SIZE;
      const CANVAS_HEIGHT = rows * TILE_SIZE;
      
      if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
      }

      let bass = 50, mid = 50, treble = 50;

      // Get real audio data if available
      if (analyser && isPlaying) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        bass = getEnergy(dataArray, 0, 40);
        mid = getEnergy(dataArray, 40, 100);
        treble = getEnergy(dataArray, 100, Math.min(256, dataArray.length));

        // Beat detection
        detectBeats(bass, mid, treble);

        if (frameCount % 120 === 0) {
          const detection = beatDetectionRef.current;
          console.log(`BPM: ${detection.bpm.toFixed(0)}, Beat: ${detection.beatStrength.toFixed(2)}, Bass: ${bass.toFixed(1)}`);
        }
      } else {
        // Generate gentle fake data for ambient animation
        const t = performance.now() / 3000;
        bass = 40 + Math.sin(t) * 15 + Math.random() * 10;
        mid = 35 + Math.sin(t * 1.3) * 12 + Math.random() * 8;
        treble = 30 + Math.sin(t * 1.7) * 10 + Math.random() * 6;
      }

      const energyMap = { bass, mid, treble };
      const detection = beatDetectionRef.current;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const t = performance.now() / 1000;
      const beatTime = (60 / detection.bpm) * 1000; // Time between beats in ms
      const beatPhase = (performance.now() % beatTime) / beatTime; // 0-1 through each beat

      // Update shapes with tempo-based movement
      shapesRef.current.forEach((shape, index) => {
        const targetEnergy = energyMap[shape.band] / 255;
        shape.energy += (targetEnergy - shape.energy) * 0.1;
        
        // Tempo-based dance intensity
        if (isPlaying && analyser) {
          const spike = detection.energySpikes[shape.band] || 0;
          shape.danceIntensity = spike * shape.beatResponse;
          
          // Beat-based size boost - much more conservative
          if (detection.kickDetected && shape.band === 'bass') {
            shape.lastBeatBoost = detection.beatStrength * 1.5; // Reduced from 3
          } else if (detection.snareDetected && shape.band === 'mid') {
            shape.lastBeatBoost = detection.beatStrength * 1.2; // Reduced from 2.5
          } else if (detection.hihatDetected && shape.band === 'treble') {
            shape.lastBeatBoost = detection.beatStrength * 1; // Reduced from 2
          }
          
          // Faster decay to prevent sustained large sizes
          shape.lastBeatBoost *= 0.85; // Faster decay from 0.88
          
          // Enhanced rhythmic movement based on BPM
          const beatIntensity = 1 + detection.beatStrength * 2;
          const rhythmicMovement = Math.sin(beatPhase * Math.PI * 2 + shape.rhythmOffset) * shape.tempoMultiplier * beatIntensity;
          const fastRhythm = Math.sin(beatPhase * Math.PI * 4 + shape.rhythmOffset) * 0.5; // Double-time movement
          const danceMovement = shape.danceIntensity * 1.5; // Increased dance intensity
          
          // More aggressive beat-based movement
          const beatPulse = Math.max(0, Math.sin(beatPhase * Math.PI * 2) * 2); // Stronger beat pulse
          const energyBoost = 1 + (shape.energy * 2); // More energy-based movement
          
          // Combine all movement types with higher intensities
          const totalMovementX = shape.dx * 2 + // Double base movement
                                (rhythmicMovement * shape.baseDirection.x * 0.3) + // Triple rhythmic movement
                                (fastRhythm * shape.baseDirection.x * 0.2) + // Fast rhythm component
                                (danceMovement * Math.sin(t * 8 + shape.offset)) + // Faster dance
                                (beatPulse * shape.baseDirection.x * 0.15); // Beat pulse movement
                                
          const totalMovementY = shape.dy * 2 + // Double base movement
                                (rhythmicMovement * shape.baseDirection.y * 0.3) + // Triple rhythmic movement
                                (fastRhythm * shape.baseDirection.y * 0.2) + // Fast rhythm component
                                (danceMovement * Math.cos(t * 8 + shape.offset)) + // Faster dance
                                (beatPulse * shape.baseDirection.y * 0.15); // Beat pulse movement
          
          shape.x += totalMovementX * (0.8 + shape.energy * 2.5) * energyBoost;
          shape.y += totalMovementY * (0.8 + shape.energy * 2.5) * energyBoost;
          
          // Much more aggressive beat-based directional kicks
          if (detection.kickDetected && Math.random() < 0.7) {
            const kickStrength = detection.beatStrength * 0.08;
            shape.dx += (Math.random() - 0.5) * kickStrength;
            shape.dy += (Math.random() - 0.5) * kickStrength;
          }
          
          // Add snare-based direction changes
          if (detection.snareDetected && Math.random() < 0.5) {
            const snareStrength = detection.beatStrength * 0.06;
            shape.dx += Math.sin(t * 10) * snareStrength;
            shape.dy += Math.cos(t * 10) * snareStrength;
          }
          
          // Hi-hat creates jittery movement
          if (detection.hihatDetected && Math.random() < 0.4) {
            const jitterStrength = detection.beatStrength * 0.04;
            shape.dx += (Math.random() - 0.5) * jitterStrength;
            shape.dy += (Math.random() - 0.5) * jitterStrength;
          }
          
          // Sudden direction changes on strong beats
          if (detection.beatStrength > 0.7 && Math.random() < 0.2) {
            shape.baseDirection.x = (Math.random() - 0.5) * 2;
            shape.baseDirection.y = (Math.random() - 0.5) * 2;
          }
          
        } else {
          // Gentle ambient movement
          shape.x += shape.dx * 0.3;
          shape.y += shape.dy * 0.3;
        }

        // Bounce off edges with varying energy based on music
        const bounceEnergy = isPlaying && analyser ? -0.6 - (detection.beatStrength * 0.4) : -0.8;
        if (shape.x <= 0 || shape.x >= cols) {
          shape.dx *= bounceEnergy;
          shape.x = Math.max(0, Math.min(cols, shape.x));
          
          // Add extra kick on musical bounces
          if (isPlaying && detection.beatStrength > 0.5) {
            shape.dy += (Math.random() - 0.5) * 0.05 * detection.beatStrength;
          }
        }
        if (shape.y <= 0 || shape.y >= rows) {
          shape.dy *= bounceEnergy;
          shape.y = Math.max(0, Math.min(rows, shape.y));
          
          // Add extra kick on musical bounces
          if (isPlaying && detection.beatStrength > 0.5) {
            shape.dx += (Math.random() - 0.5) * 0.05 * detection.beatStrength;
          }
        }

        // Damping to prevent shapes from going too fast
        const maxSpeed = isPlaying ? 0.2 + detection.beatStrength * 0.3 : 0.1;
        const currentSpeed = Math.sqrt(shape.dx * shape.dx + shape.dy * shape.dy);
        if (currentSpeed > maxSpeed) {
          const dampingFactor = maxSpeed / currentSpeed;
          shape.dx *= dampingFactor;
          shape.dy *= dampingFactor;
        }

        // Dynamic size with more controlled beat response
        let sizeMultiplier;
        if (isPlaying && analyser) {
          const beatSize = 1 + (shape.lastBeatBoost * 0.3); // Much smaller beat size boost
          const rhythmSize = 1 + Math.sin(beatPhase * Math.PI * 2 + shape.rhythmOffset) * 0.15 * shape.tempoMultiplier; // Smaller rhythm
          const energySize = 1 + (shape.energy * 0.6); // Reduced energy size variation
          const beatPulseSize = 1 + Math.max(0, Math.sin(beatPhase * Math.PI * 2)) * detection.beatStrength * 0.2; // Much smaller pulse
          sizeMultiplier = (0.7 + shape.energy * 0.8) * beatSize * rhythmSize * energySize * beatPulseSize; // More conservative base
        } else {
          sizeMultiplier = 0.8 + Math.sin(t * 0.5 + shape.offset) * 0.15; // Smaller ambient pulsing
        }
        
        shape.dynamicSize = shape.baseSize * sizeMultiplier;
      });

      // Draw grid tiles
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let r = 0, g = 0, b = 0, alpha = 0;

          shapesRef.current.forEach(shape => {
            const dx = shape.x - gx;
            const dy = shape.y - gy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // More controlled pulsing effect with beat synchronization
            let pulseIntensity = Math.sin(t * 3 + shape.offset) * 0.15 + 0.85; // Smaller pulse range
            if (isPlaying && analyser) {
              pulseIntensity *= 1 + Math.sin(beatPhase * Math.PI * 2) * 0.1; // Much smaller beat sync
            }
            
            const radius = shape.dynamicSize * 1.6 * pulseIntensity; // Smaller radius multiplier

            if (distance < radius) {
              const influence = Math.max(0, 1 - Math.pow(distance / radius, 1.2)); // Steeper falloff
              const brightness = influence * influence * influence; // More concentrated

              const [cr, cg, cb] = hexToRgb(shape.color);
              
              // Much more controlled intensity to prevent white-out
              let baseIntensity = isPlaying ? (0.25 + shape.energy * 0.4) : 0.2; // Reduced base
              let beatMultiplier = 1;
              
              if (isPlaying && analyser) {
                // More conservative beat enhancement
                beatMultiplier = 1 + (shape.lastBeatBoost * 0.15); // Much smaller beat boost
                beatMultiplier *= 1 + (detection.beatStrength * 0.1); // Smaller beat strength bonus
              }
              
              const finalIntensity = baseIntensity * beatMultiplier * shape.intensity;
              
              // Apply color with controlled intensity
              r += cr * brightness * finalIntensity;
              g += cg * brightness * finalIntensity;
              b += cb * brightness * finalIntensity;
              alpha += brightness * finalIntensity * 0.3; // Reduced alpha contribution
              
              // Much more selective and subtle white flash
              const coreDistance = distance / radius;
              if (detection.beatStrength > 0.8 && coreDistance < 0.2) { // Only very center, very strong beats
                const flashIntensity = (detection.beatStrength - 0.8) * 0.1; // Much smaller flash
                const coreEffect = (1 - coreDistance * 5) * flashIntensity; // Very localized
                r += 60 * coreEffect; // Much smaller white addition
                g += 60 * coreEffect;
                b += 60 * coreEffect;
              }
            }
          });

          // Clamp values more aggressively to prevent oversaturation
          r = Math.min(200, r); // Lower ceiling to preserve color
          g = Math.min(200, g);
          b = Math.min(200, b);
          alpha = Math.min(0.7, alpha); // Lower alpha ceiling

          if (alpha > 0.02) {
            ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
            ctx.fillRect(
              gx * TILE_SIZE + TILE_MARGIN,
              gy * TILE_SIZE + TILE_MARGIN,
              VISIBLE_SIZE,
              VISIBLE_SIZE
            );
          }
        }
      }

      // Debug overlay with tempo info
      if (frameCount % 60 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`Audio: ${analyser ? '✓' : '✗'} | Playing: ${isPlaying ? '✓' : '✗'}`, 10, 20);
        if (isPlaying && analyser) {
          ctx.fillText(`BPM: ${detection.bpm.toFixed(0)} | Beat: ${detection.beatStrength.toFixed(2)}`, 10, 35);
          ctx.fillText(`K:${detection.kickDetected ? '●' : '○'} S:${detection.snareDetected ? '●' : '○'} H:${detection.hihatDetected ? '●' : '○'}`, 10, 50);
        }
      }
    };

    draw();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [analyser, isPlaying, grid]);

  return (
    <div
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: '#0F172A'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
}

function getEnergy(dataArray, start, end) {
  let sum = 0;
  const actualEnd = Math.min(end, dataArray.length);
  for (let i = start; i < actualEnd; i++) {
    sum += dataArray[i];
  }
  return sum / (actualEnd - start);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

export default VisualizerGrid;