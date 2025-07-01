import { useRef, useEffect, useState } from 'react';

const TILE_SIZE = 16;
const TILE_MARGIN = 2;
const VISIBLE_SIZE = TILE_SIZE - TILE_MARGIN * 2;

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

  // Initialize shapes and handle resize
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cols = Math.floor(width / TILE_SIZE);
      const rows = Math.floor(height / TILE_SIZE);
      setGrid({ cols, rows });
      // Update existing shapes for new grid size
      if (shapesRef.current.length > 0) {
        shapesRef.current.forEach(shape => {
          // Keep shapes proportionally positioned
          shape.x = Math.min(shape.x, cols - 1);
          shape.y = Math.min(shape.y, rows - 1);
          
          // Scale shape sizes based on screen size
          const screenScale = Math.min(width / 800, height / 600); // Relative to ideal size
          shape.screenScale = Math.max(0.5, Math.min(2, screenScale)); // Clamp between 0.5x and 2x
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

    // Calculate number of shapes based on screen size
    const area = cols * rows;
    const shapeCount = Math.max(6, Math.min(20, Math.floor(area / 100))); // 6-20 shapes based on size
    
    const allColors = Object.keys(COLORS);

    shapesRef.current = Array.from({ length: shapeCount }).map((_, i) => {
      const colorKey = allColors[i % allColors.length];
      return {
        type: ['circle', 'square', 'triangle', 'hexagon'][i % 4],
        x: Math.random() * cols,
        y: Math.random() * rows,
        dx: (Math.random() - 0.5) * 0.03, // Slower base movement
        dy: (Math.random() - 0.5) * 0.03,
        baseSize: 12 + Math.random() * 15, // Bigger base sizes
        maxSize: 25 + Math.random() * 20,   // Even bigger max sizes
        band: ['bass', 'mid', 'treble'][i % 3],
        color: COLORS[colorKey],
        offset: Math.random() * 1000,
        energy: 0,
        targetEnergy: 0,
        screenScale: 1, // Will be set by resize
        intensity: 0.5 + Math.random() * 0.5, // Random intensity multiplier
      };
    });
    console.log('Created', shapesRef.current.length, 'shapes for grid', cols, 'x', rows);
  }, [grid]);

  // Main animation loop - always runs
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    console.log('Starting visualizer animation');

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      frameCount++;

      const { cols, rows } = grid;
      if (cols <= 0 || rows <= 0) return;

      const CANVAS_WIDTH = cols * TILE_SIZE;
      const CANVAS_HEIGHT = rows * TILE_SIZE;
      
      // Set canvas size
      if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
      }

      let bass = 50, mid = 50, treble = 50; // Default values for gentle animation

      // Get real audio data if available
      if (analyser && isPlaying) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        bass = getEnergy(dataArray, 0, 40);
        mid = getEnergy(dataArray, 40, 100);
        treble = getEnergy(dataArray, 100, Math.min(256, dataArray.length));

        // Debug occasionally
        if (frameCount % 120 === 0) {
          const sum = dataArray.reduce((a, b) => a + b, 0);
          console.log(`Frame ${frameCount}: Audio data sum=${sum}, bass=${bass.toFixed(1)}, mid=${mid.toFixed(1)}, treble=${treble.toFixed(1)}`);
        }
      } else {
        // Generate gentle fake data for ambient animation
        const t = performance.now() / 3000;
        bass = 40 + Math.sin(t) * 15 + Math.random() * 10;
        mid = 35 + Math.sin(t * 1.3) * 12 + Math.random() * 8;
        treble = 30 + Math.sin(t * 1.7) * 10 + Math.random() * 6;
      }

      const energyMap = { bass, mid, treble };

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const t = performance.now() / 1000;

      // Update shapes
      shapesRef.current.forEach((shape, index) => {
        // Get energy for this shape's frequency band
        const targetEnergy = energyMap[shape.band] / 255;
        
        // Smooth energy transitions
        shape.energy += (targetEnergy - shape.energy) * 0.1;
        
        // Movement speed based on energy and playing state
        const energyMultiplier = isPlaying ? (0.3 + shape.energy * 1.5) : 0.3;
        const speed = energyMultiplier;
        
        shape.x += shape.dx * speed;
        shape.y += shape.dy * speed;

        // Bounce off edges
        if (shape.x <= 0 || shape.x >= cols) {
          shape.dx *= -1;
          shape.x = Math.max(0, Math.min(cols, shape.x));
        }
        if (shape.y <= 0 || shape.y >= rows) {
          shape.dy *= -1;
          shape.y = Math.max(0, Math.min(rows, shape.y));
        }

        // Dynamic size based on energy
        const baseSizeMultiplier = isPlaying ? (0.6 + shape.energy * 1.4) : (0.8 + Math.sin(t * 0.5 + shape.offset) * 0.2);
        shape.dynamicSize = shape.baseSize * baseSizeMultiplier;
      });

      // Draw grid tiles
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let r = 0, g = 0, b = 0, alpha = 0;

          // Calculate influence from each shape
          shapesRef.current.forEach(shape => {
            const dx = shape.x - gx;
            const dy = shape.y - gy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Pulsing effect
            const pulse = Math.sin(t * 3 + shape.offset) * 0.3 + 0.7;
            const radius = shape.dynamicSize * 2 * pulse;

            if (distance < radius) {
              const influence = Math.max(0, 1 - Math.pow(distance / radius, 0.8));
              const brightness = influence * influence;

              const [cr, cg, cb] = hexToRgb(shape.color);
              
              // Add color with energy-based intensity
              const intensity = isPlaying ? (0.4 + shape.energy * 0.8) : 0.3;
              r += cr * brightness * intensity;
              g += cg * brightness * intensity;
              b += cb * brightness * intensity;
              alpha += brightness * intensity * 0.4;
            }
          });

          // Clamp values
          r = Math.min(255, r);
          g = Math.min(255, g);
          b = Math.min(255, b);
          alpha = Math.min(0.9, alpha);

          if (alpha > 0.01) {
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

      // Debug overlay
      if (frameCount % 60 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`Audio: ${analyser ? '✓' : '✗'} | Playing: ${isPlaying ? '✓' : '✗'}`, 10, 20);
        ctx.fillText(`Bass: ${bass.toFixed(0)} Mid: ${mid.toFixed(0)} Treble: ${treble.toFixed(0)}`, 10, 35);
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