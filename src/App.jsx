import './App.css';
import { useRef, useState, useCallback } from 'react';
import VisualizerGrid from './components/VisualizerGrid';
import Waveform from './components/Waveform';

function App() {
  const waveformRef = useRef();
  const [audioUrl, setAudioUrl] = useState(null);
  const [trackName, setTrackName] = useState('');
  const [audioCtx, setAudioCtx] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  // Use useCallback to prevent function recreation on every render
  const handleWaveformReady = useCallback(({ ctx, analyser }) => {
    console.log('Audio context and analyser ready');
    setAudioCtx(ctx);
    setAnalyser(analyser);
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Clean up old audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(URL.createObjectURL(file));
    setTrackName(file.name);
  };

  const togglePlay = () => {
    const ws = waveformRef.current;
    if (!ws) return;
    if (ws.isPlaying()) {
      ws.pause();
    } else {
      ws.play();
    }
  };

  return (
    <div
      className="app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      <header className="top-bar">
        <button>🎵 Playlist</button>
        <button>🔀 Shuffle</button>
        <button>⚙ Settings</button>
        <button>🟪 Visual</button>
        <button>🎚 DJ</button>
      </header>

      <div style={{ flex: 1, height: '100vh' }}>
        <VisualizerGrid
          audioCtx={audioCtx}
          analyser={analyser}
          isPlaying={!!audioUrl && waveformRef.current?.isPlaying()}
        />
      </div>
      
      <div>
        <Waveform 
          ref={waveformRef} 
          audioUrl={audioUrl} 
          onReady={handleWaveformReady}
        />
      </div>
      
      <footer className="bottom-bar">
        <button onClick={togglePlay}>⏯ Play/Pause</button>
        <span>{trackName || 'Drop a file...'}</span>
      </footer>
    </div>
  );
}

export default App;