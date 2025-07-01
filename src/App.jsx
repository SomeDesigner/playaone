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
  const [isPlaying, setIsPlaying] = useState(false);

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
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const ws = waveformRef.current;
    if (!ws) return;
    
    if (ws.isPlaying()) {
      ws.pause();
      setIsPlaying(false);
    } else {
      ws.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className="app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F172A'
      }}
    >
      <header className="top-bar" style={{
        display: 'flex',
        gap: '10px',
        padding: '10px',
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #334155'
      }}>
        <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: 'white' }}>🎵 Playlist</button>
        <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: 'white' }}>🔀 Shuffle</button>
        <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: 'white' }}>⚙ Settings</button>
        <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: 'white' }}>🟪 Visual</button>
        <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#475569', color: 'white' }}>🎚 DJ</button>
      </header>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <VisualizerGrid
          audioCtx={audioCtx}
          analyser={analyser}
          isPlaying={isPlaying}
        />
      </div>
      
      <div style={{ height: '64px', backgroundColor: '#1E293B', borderTop: '1px solid #334155' }}>
        <Waveform 
          ref={waveformRef} 
          audioUrl={audioUrl} 
          onReady={handleWaveformReady}
        />
      </div>
      
      <footer className="bottom-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px',
        backgroundColor: '#1E293B',
        borderTop: '1px solid #334155'
      }}>
        <button 
          onClick={togglePlay} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            border: 'none', 
            backgroundColor: '#8B5CF6', 
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <span style={{ color: 'white', fontSize: '14px' }}>
          {trackName || 'Drop a file...'}
        </span>
      </footer>
    </div>
  );
}

export default App;