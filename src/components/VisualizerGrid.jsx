import { useRef, useEffect, useState } from 'react';

const TILE_SIZE = 16;
const TILE_MARGIN = 2;
const VISIBLE_SIZE = TILE_SIZE - TILE_MARGIN * 2;

const COLORS = {
  bass: '#5EEAD4',
  mid: '#8B5CF6',
  treble: '#F97316',
};

function VisualizerGrid({ audioCtx, analyser, isPlaying }) {
  const canvasRef = useRef();
  const containerRef = useRef();
  const shapesRef = useRef([]);
  const animationIdRef = useRef();
  const [grid, setGrid] = useState({ cols: 16, rows: 16 });

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cols = Math.floor(width / TILE_SIZE);
      const rows = Math.floor(height / TILE_SIZE);
      setGrid({ cols, rows });

      // Reassign blob sizes based on screen size with a more conservative scale factor
      const sizeScale = Math.min(width, height) / 600; // Smaller blobs on small screens
      shapesRef.current.forEach(shape => {
        shape.baseSize = (6 + Math.random() * 10) * sizeScale;
      });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    shapesRef.current = Array.from({ length: 12 }).map((_, i) => ({
      type: ['circle', 'square', 'triangle', 'hexagon'][i % 4],
      x: Math.random() * grid.cols,
      y: Math.random() * grid.rows,
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      baseSize: 6 + Math.random() * 10,
      band: ['bass', 'mid', 'treble'][i % 3],
      color: COLORS[['bass', 'mid', 'treble'][i % 3]],
      offset: Math.random() * 1000,
    }));
  }, [grid]);

  useEffect(() => {
    if (!audioCtx || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      
      // Get real audio data if available, otherwise generate fake data
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Generate subtle fake audio data for ambient animation
        const t = performance.now() / 1000;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(t * 0.5 + i * 0.1) * 20 + 30 + Math.random() * 10;
        }
      }

      const { cols, rows } = grid;
      const CANVAS_WIDTH = cols * TILE_SIZE;
      const CANVAS_HEIGHT = rows * TILE_SIZE;
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      const bass = getEnergy(dataArray, 0, 40);
      const mid = getEnergy(dataArray, 40, 100);
      const treble = getEnergy(dataArray, 100, 256);
      const energyMap = { bass, mid, treble };

      ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const t = performance.now() / 1000;

      shapesRef.current.forEach(shape => {
        const energy = energyMap[shape.band] / 255;
        // Slow movement when no audio, faster when playing
        const baseSpeed = analyser && isPlaying ? 0.05 + energy * 0.5 : 0.02;
        const speed = baseSpeed;
        
        shape.x += shape.dx * speed * 10;
        shape.y += shape.dy * speed * 10;

        // Bounce off edges
        if (shape.x < 0 || shape.x > cols) shape.dx *= -1;
        if (shape.y < 0 || shape.y > rows) shape.dy *= -1;

        // Size based on energy (or subtle pulsing if no audio)
        if (analyser) {
          shape.dynamicSize = shape.baseSize * (0.5 + energy * 1.5);
        } else {
          // Gentle pulsing without audio
          shape.dynamicSize = shape.baseSize * (0.8 + Math.sin(t + shape.offset) * 0.2);
        }
      });

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let r = 0, g = 0, b = 0;
          let alpha = 0.05;

          shapesRef.current.forEach(shape => {
            const dx = shape.x - gx;
            const dy = shape.y - gy;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            const energy = energyMap[shape.band] / 255;
            const pulse = Math.sin(t * 2 + shape.offset) * 0.5 + 1;
            const radius = shape.dynamicSize * 1.5 + pulse * energy * 10;

            const influence = Math.max(0, 1 - Math.pow(dist / radius, 0.7));
            const brightnessBoost = Math.max(0, 1 - distSq / (radius * radius));
            
            const [cr, cg, cb] = hexToRgb(shape.color);
            const intensityMultiplier = analyser ? 1 : 0.4;
            // Apply influence and brightness boost
            r += (cr * influence * influence + 255 * brightnessBoost * 0.3);
            g += (cg * influence * influence + 255 * brightnessBoost * 0.3);
            b += (cb * influence * influence + 255 * brightnessBoost * 0.3);
            alpha += (influence * 0.3 + brightnessBoost * 0.1) * intensityMultiplier;

            shapesRef.current.forEach(other => {
              if (other === shape) return;
              const dx2 = shape.x - other.x;
              const dy2 = shape.y - other.y;
              const close = dx2 * dx2 + dy2 * dy2 < 4;
              if (close) {
                const [or, og, ob] = hexToRgb(other.color);
                r = mix(r, or, 0.1);
                g = mix(g, og, 0.1);
                b = mix(b, ob, 0.1);
              }
            });
          });

          r = Math.min(255, r);
          g = Math.min(255, g);
          b = Math.min(255, b);
          alpha = Math.min(1, alpha);

          ctx.fillStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${alpha})`;
          ctx.fillRect(
            gx * TILE_SIZE + TILE_MARGIN,
            gy * TILE_SIZE + TILE_MARGIN,
            VISIBLE_SIZE,
            VISIBLE_SIZE
          );
        }
      }
    };

    draw();
    // Cleanup animation on unmount
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [analyser, isPlaying, grid]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated', backgroundColor: '#0F172A' }}
      />
    </div>
  );
}

function getEnergy(dataArray, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) sum += dataArray[i];
  return sum / (end - start);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function mix(a, b, f) {
  return a * (1 - f) + b * f;
}

export default VisualizerGrid;