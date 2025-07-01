import './App.css';
import { useRef, useState, useCallback, useEffect } from 'react';
import VisualizerGrid from './components/VisualizerGrid';
import Waveform from './components/Waveform';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import PlaylistSidebar from './components/PlaylistSidebar';

function App() {
  const waveformRef = useRef();
  const [audioUrl, setAudioUrl] = useState(null);
  const [trackName, setTrackName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [audioCtx, setAudioCtx] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  
  // UI State
  const [theme, setTheme] = useState('light');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [activeView, setActiveView] = useState('visualization');

  const handleWaveformReady = useCallback(({ ctx, analyser }) => {
    console.log('Audio context and analyser ready');
    setAudioCtx(ctx);
    setAnalyser(analyser);
  }, []);

  // Extract metadata from filename
  const extractMetadata = (filename) => {
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExtension.split(' - ');
    
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim()
      };
    }
    
    return {
      artist: 'Unknown Artist',
      title: nameWithoutExtension
    };
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    const metadata = extractMetadata(file.name);
    setAudioUrl(URL.createObjectURL(file));
    setTrackName(metadata.title);
    setArtistName(metadata.artist);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handlePlay = () => {
    const ws = waveformRef.current;
    if (!ws || !audioUrl) return;
    
    ws.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    const ws = waveformRef.current;
    if (!ws) return;
    
    ws.pause();
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    const ws = waveformRef.current;
    if (!ws) return;
    
    ws.seekTo(0);
    setCurrentTime(0);
  };

  const handleNext = () => {
    console.log('Next track - playlist functionality needed');
  };

  const handleLoop = () => {
    setLoopEnabled(!loopEnabled);
    console.log('Loop toggled:', !loopEnabled);
  };

  const handleSeek = (time) => {
    const ws = waveformRef.current;
    if (!ws) return;
    
    ws.seekTo(time);
    setCurrentTime(time);
  };

  // Update time periodically
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const ws = waveformRef.current;
      if (ws) {
        const current = ws.getCurrentTime();
        const dur = ws.getDuration();
        setCurrentTime(current || 0);
        setDuration(dur || 0);
        
        // Handle loop
        if (loopEnabled && dur && current >= dur - 0.1) {
          ws.seekTo(0);
          setCurrentTime(0);
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, loopEnabled]);

  // Theme styles
  const themeStyles = {
    light: {
      background: '#ffffff',
      secondary: '#f8f9fa',
      border: '#e5e5e5',
      text: '#333333',
      textSecondary: '#666666'
    },
    dark: {
      background: '#0F172A',
      secondary: '#1E293B',
      border: '#334155',
      text: '#ffffff',
      textSecondary: '#94a3b8'
    }
  };

  const colors = themeStyles[theme];

  // Render different views
  const renderMainContent = () => {
    switch (activeView) {
      case 'visualization':
        return (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <VisualizerGrid
              audioCtx={audioCtx}
              analyser={analyser}
              isPlaying={isPlaying}
            />
          </div>
        );
      case 'settings':
        return (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: colors.background,
            color: colors.text
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <h2 style={{ margin: '0 0 16px 0', color: colors.text }}>Settings</h2>
              <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>
                Configure your media player preferences
              </p>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                <span style={{ color: colors.text }}>Theme:</span>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.secondary,
                    color: colors.text,
                    cursor: 'pointer'
                  }}
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>
              
              <div style={{ 
                padding: '20px', 
                backgroundColor: colors.secondary, 
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}>
                <p style={{ color: colors.textSecondary, margin: 0 }}>
                  More settings coming soon...
                </p>
              </div>
            </div>
          </div>
        );
      case 'dj':
        return (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: colors.background,
            color: colors.text
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <h2 style={{ margin: '0 0 16px 0', color: colors.text }}>DJ Mode</h2>
              <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>
                Advanced mixing and effects controls
              </p>
              <div style={{ 
                padding: '40px', 
                backgroundColor: colors.secondary, 
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}>
                <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>🎚️</span>
                <p style={{ color: colors.textSecondary, margin: 0 }}>
                  DJ controls coming soon...
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
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
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      <TopBar
        onPlaylistToggle={() => setPlaylistOpen(!playlistOpen)}
        onShuffleToggle={() => setShuffleEnabled(!shuffleEnabled)}
        onSettingsClick={() => setActiveView('settings')}
        onVisualizationClick={() => setActiveView('visualization')}
        onDJClick={() => setActiveView('dj')}
        playlistOpen={playlistOpen}
        shuffleEnabled={shuffleEnabled}
        activeView={activeView}
        theme={theme}
      />

      <PlaylistSidebar isOpen={playlistOpen} onClose={() => setPlaylistOpen(false)}/>

      {renderMainContent()}
      
      <div style={{ 
        height: '64px', 
        backgroundColor: colors.secondary, 
        borderTop: `1px solid ${colors.border}` 
      }}>
        <Waveform 
          ref={waveformRef} 
          audioUrl={audioUrl} 
          onReady={handleWaveformReady}
          theme={theme}
        />
      </div>
      
      <Footer
        trackName={trackName}
        artistName={artistName}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlay={handlePlay}
        onPause={handlePause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onLoop={handleLoop}
        onSeek={handleSeek}
        loopEnabled={loopEnabled}
        theme={theme}
      />
    </div>
  );
}

export default App;