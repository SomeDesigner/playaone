import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = forwardRef(({ audioUrl, onReady }, ref) => {
  const containerRef = useRef();
  const waveSurferRef = useRef();
  const isConnectedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    play: () => waveSurferRef.current?.play(),
    pause: () => waveSurferRef.current?.pause(),
    isPlaying: () => waveSurferRef.current?.isPlaying() || false,
    getCurrentTime: () => waveSurferRef.current?.getCurrentTime() || 0,
    seekTo: (time) => {
      const duration = waveSurferRef.current?.getDuration();
      if (duration) {
        waveSurferRef.current?.seekTo(time / duration);
      }
    },
    getDuration: () => waveSurferRef.current?.getDuration() || 0,
  }));

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    // Reset connection flag
    isConnectedRef.current = false;

    // Cleanup previous instance
    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    console.log('Creating new WaveSurfer instance for:', audioUrl);

    try {
      waveSurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#94a3b8',
        progressColor: '#8B5CF6',
        cursorColor: '#F97316',
        barWidth: 2,
        barRadius: 2,
        height: 48,
        responsive: true,
        normalize: true,
        cursorWidth: 2,
      });

      waveSurferRef.current.load(audioUrl);

      const setupAudioAnalysis = () => {
        if (isConnectedRef.current || !waveSurferRef.current) return;

        try {
          console.log('Attempting to setup audio analysis...');
          
          const ws = waveSurferRef.current;
          let ctx = null;
          let sourceNode = null;

          // Method 1: Try to get from backend
          if (ws.backend) {
            console.log('Found backend, properties:', Object.keys(ws.backend));
            ctx = ws.backend.ac || ws.backend.audioContext;
            sourceNode = ws.backend.gainNode || ws.backend.source;
          }

          // Method 2: Try direct access
          if (!ctx && ws.getAudioContext) {
            ctx = ws.getAudioContext();
          }

          // Method 3: Create from media element
          if (!ctx && ws.media) {
            console.log('Creating audio context from media element');
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = ctx.createMediaElementSource(ws.media);
            // Connect to destination so audio still plays
            sourceNode.connect(ctx.destination);
          }

          if (!ctx) {
            console.log('Could not obtain audio context');
            return;
          }

          console.log('Audio context obtained:', ctx.state);

          // Create and configure analyser
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.8;

          // Connect source to analyser
          if (sourceNode) {
            try {
              sourceNode.connect(analyser);
              console.log('Successfully connected source to analyser');
              
              // Test the connection
              setTimeout(() => {
                const testData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(testData);
                const sum = testData.reduce((a, b) => a + b, 0);
                console.log('Audio analysis test - data sum:', sum, 'bins:', analyser.frequencyBinCount);
              }, 500);
              
              isConnectedRef.current = true;
              
              if (onReady) {
                onReady({ ctx, analyser });
              }
            } catch (connectError) {
              console.error('Failed to connect nodes:', connectError);
            }
          } else {
            console.log('No source node available');
          }

        } catch (error) {
          console.error('Error in setupAudioAnalysis:', error);
        }
      };

      // Try setup when ready
      waveSurferRef.current.on('ready', () => {
        console.log('WaveSurfer ready');
        setTimeout(setupAudioAnalysis, 100);
      });

      // Try setup when playing (important for audio context activation)
      waveSurferRef.current.on('play', () => {
        console.log('WaveSurfer started playing');
        setTimeout(setupAudioAnalysis, 200);
        setTimeout(setupAudioAnalysis, 1000); // Retry after 1 second
      });

      // Add error handling
      waveSurferRef.current.on('error', (error) => {
        console.error('WaveSurfer error:', error);
      });

    } catch (error) {
      console.error('Error creating WaveSurfer:', error);
    }

    return () => {
      isConnectedRef.current = false;
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }
    };
  }, [audioUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '48px',
        backgroundColor: '#1E293B',
        borderRadius: '0',
        padding: '8px',
      }}
    />
  );
});

Waveform.displayName = 'Waveform';

export default Waveform;