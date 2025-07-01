import { useState } from 'react';

function TopBar({ 
  onPlaylistToggle, 
  onShuffleToggle, 
  onSettingsClick, 
  onVisualizationClick, 
  onDJClick,
  playlistOpen = false,
  shuffleEnabled = false,
  activeView = 'visualization', // 'visualization', 'settings', 'dj'
  theme = 'light' // 'light' or 'dark'
}) {
  const [hoveredButton, setHoveredButton] = useState(null);

  // Theme styles
  const themeStyles = {
    light: {
      background: '#ffffff',
      border: '#e5e5e5',
      text: '#333333',
      textSecondary: '#666666',
      buttonBg: '#f8f9fa',
      buttonHover: '#e9ecef',
      buttonActive: '#8B5CF6',
      buttonActiveText: '#ffffff',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    dark: {
      background: '#1a1a1a',
      border: '#333333',
      text: '#ffffff',
      textSecondary: '#cccccc',
      buttonBg: '#2a2a2a',
      buttonHover: '#3a3a3a',
      buttonActive: '#8B5CF6',
      buttonActiveText: '#ffffff',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
    }
  };

  const colors = themeStyles[theme];

  const buttonStyle = (buttonName, isActive = false, isEnabled = false) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isActive || isEnabled ? colors.buttonActive : 
                    hoveredButton === buttonName ? colors.buttonHover : colors.buttonBg,
    color: isActive || isEnabled ? colors.buttonActiveText : colors.text,
    boxShadow: isActive || isEnabled ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
    transform: hoveredButton === buttonName ? 'translateY(-1px)' : 'none'
  });

  return (
    <header 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Left side buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          style={buttonStyle('playlist', playlistOpen)}
          onClick={onPlaylistToggle}
          onMouseEnter={() => setHoveredButton('playlist')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Toggle Playlist"
        >
          <span style={{ fontSize: '16px' }}>🎵</span>
          <span>Playlist</span>
        </button>

        <button
          style={buttonStyle('shuffle', false, shuffleEnabled)}
          onClick={onShuffleToggle}
          onMouseEnter={() => setHoveredButton('shuffle')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Toggle Shuffle"
        >
          <span style={{ fontSize: '16px' }}>🔀</span>
          <span>Shuffle</span>
        </button>
      </div>

      {/* App title/logo area */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontWeight: '600',
        fontSize: '18px',
        color: colors.text,
        letterSpacing: '-0.02em'
      }}>
        PlayaOne
      </div>

      {/* Right side buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          style={buttonStyle('settings', activeView === 'settings')}
          onClick={onSettingsClick}
          onMouseEnter={() => setHoveredButton('settings')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Settings"
        >
          <span style={{ fontSize: '16px' }}>⚙️</span>
        </button>

        <button
          style={buttonStyle('visualization', activeView === 'visualization')}
          onClick={onVisualizationClick}
          onMouseEnter={() => setHoveredButton('visualization')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Visualization"
        >
          <span style={{ fontSize: '16px' }}>🟪</span>
        </button>

        <button
          style={buttonStyle('dj', activeView === 'dj')}
          onClick={onDJClick}
          onMouseEnter={() => setHoveredButton('dj')}
          onMouseLeave={() => setHoveredButton(null)}
          title="DJ Mode"
        >
          <span style={{ fontSize: '16px' }}>🎚️</span>
        </button>
      </div>
    </header>
  );
}

export default TopBar;