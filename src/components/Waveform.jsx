import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = forwardRef(({ audioUrl, onReady }, ref) => {
  const containerRef = useRef();
  const waveSurferRef = useRef();
  const isConnectedRef = useRef(false); // Prevent multiple connections

  useImperativeHandle(ref, () => ({
    play: () => waveSurferRef.current?.play(),
    pause: () => waveSurferRef.current?.pause(),
    isPlaying: () => waveSurferRef.current?.isPlaying(),
    getCurrentTime: () => waveSurferRef.current?.getCurrentTime(),
    seekTo: (time) => waveSurferRef.current?.seekTo(time / waveSurferRef.current.getDuration()),
    getDuration: () => waveSurferRef.current?.getDuration(),
  }));

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    // Reset connection flag when new audio loads
    isConnectedRef.current = false;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }

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
      if (isConnectedRef.current) return; // Prevent multiple setups
      if (!waveSurferRef.current) return; // Make sure WaveSurfer exists

      try {
        const backend = waveSurferRef.current.backend;
        
        // Check if backend exists and has the properties we need
        if (!backend) {
          console.log('Backend not available yet');
          return;
        }

        console.log('Backend available, properties:', Object.keys(backend));
        
        let ctx = backend.ac || backend.audioContext || backend.context;
        
        if (!ctx) {
          console.log('No audio context found in backend, trying alternative approaches');
          
          // Try to get audio context from WaveSurfer instance directly
          if (waveSurferRef.current.getAudioContext) {
            ctx = waveSurferRef.current.getAudioContext();
          }
          
          // Last resort: try the media element approach
          if (!ctx && waveSurferRef.current.media) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Created new audio context');
          }
        }

        if (!ctx) {
          console.log('Still no audio context available');
          return;
        }

        console.log('Audio context found:', ctx);

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        // Try to connect to audio source
        let connected = false;

        // Method 1: gainNode
        if (backend.gainNode) {
          try {
            backend.gainNode.connect(analyser);
            connected = true;
            console.log('Connected via gainNode');
          } catch (e) {
            console.log('gainNode connection failed:', e.message);
          }
        }

        // Method 2: source node
        if (!connected && backend.source) {
          try {
            backend.source.connect(analyser);
            connected = true;
            console.log('Connected via source');
          } catch (e) {
            console.log('source connection failed:', e.message);
          }
        }

        // Method 3: media element source (fallback)
        if (!connected && waveSurferRef.current.media) {
          try {
            const mediaSource = ctx.createMediaElementSource(waveSurferRef.current.media);
            mediaSource.connect(analyser);
            mediaSource.connect(ctx.destination); // Keep audio playing
            connected = true;
            console.log('Connected via media element source');
          } catch (e) {
            console.log('media element source connection failed:', e.message);
          }
        }

        if (connected) {
          isConnectedRef.current = true;
          console.log('Audio analysis connected successfully');
          
          // Test the analyser
          const testData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(testData);
          console.log('Analyser test - frequency bins:', analyser.frequencyBinCount);
          
          if (onReady) {
            onReady({ ctx, analyser });
          }
        } else {
          console.log('Could not connect to any audio source');
        }
      } catch (error) {
        console.error('Error setting up audio analysis:', error);
        console.error('Error details:', error.message);
      }
    };

    // Try to connect when ready
    waveSurferRef.current.on('ready', () => {
      console.log('WaveSurfer ready event fired');
      // Give it a moment for everything to initialize
      setTimeout(setupAudioAnalysis, 100);
    });
    
    // Also try when playing starts (audio context might not be ready until user interaction)
    waveSurferRef.current.on('play', () => {
      console.log('WaveSurfer play event fired');
      // Try multiple times with increasing delays
      setTimeout(setupAudioAnalysis, 100);
      setTimeout(setupAudioAnalysis, 500);
      setTimeout(setupAudioAnalysis, 1000);
    });

    return () => {
      isConnectedRef.current = false;
      waveSurferRef.current?.destroy();
    };
  }, [audioUrl]); // Remove onReady from dependencies to prevent re-renders

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '48px',
        overflow: 'hidden',
        borderRadius: '0',
        backgroundColor: '#F8F8F8',
        padding: '8px',
      }}
    />
  );
});

export default Waveform;