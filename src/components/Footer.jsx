import { useState, useEffect } from 'react';

function Footer({ 
  trackName = '', 
  artistName = '', 
  isPlaying = false, 
  currentTime = 0, 
  duration = 0,
  onPlay, 
  onPause, 
  onPrevious, 
  onNext, 
  onLoop,
  onSeek,
  loopEnabled = false,
  theme = 'light' 
}) {
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [activeButtons, setActiveButtons] = useState({
    previous: false,
    play: false,
    next: false,
    loop: false
  });

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
      playButton: '#8B5CF6',
      playButtonHover: '#7C3AED',
      shadow: '0 -1px 3px rgba(0, 0, 0, 0.1)'
    },
    dark: {
      background: '#1a1a1a',
      border: '#333333',
      text: '#ffffff',
      textSecondary: '#cccccc',
      buttonBg: '#2a2a2a',
      buttonHover: '#3a3a3a',
      buttonActive: '#8B5CF6',
      playButton: '#8B5CF6',
      playButtonHover: '#7C3AED',
      shadow: '0 -1px 3px rgba(0, 0, 0, 0.3)'
    }
  };

  const colors = themeStyles[theme];

  // Format time helper
  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get display time
  const getDisplayTime = () => {
    if (showTimeRemaining && duration > 0) {
      const remaining = duration - currentTime;
      return `-${formatTime(remaining)}`;
    }
    return formatTime(currentTime);
  };

  // Handle button click with morph animation
  const handleButtonClick = (buttonName, callback) => {
    setActiveButtons(prev => ({ ...prev, [buttonName]: true }));
    
    // Reset after animation
    setTimeout(() => {
      setActiveButtons(prev => ({ ...prev, [buttonName]: false }));
    }, 200);
    
    if (callback) callback();
  };

  // Control button style with morphing
  const getControlButtonStyle = (buttonName, isStaticActive = false) => {
    const isPressed = activeButtons[buttonName];
    const isActive = isStaticActive || isPressed;
    
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: isPressed ? '50%' : '16px', // Morph to circle when pressed
      border: 'none',
      backgroundColor: isActive ? colors.buttonActive : 
                      hoveredButton === buttonName ? colors.buttonHover : colors.buttonBg,
      color: isActive ? '#ffffff' : colors.text,
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: hoveredButton === buttonName ? 'scale(1.05)' : 'scale(1)',
      boxShadow: hoveredButton === buttonName ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
    };
  };

  // Play button style with morphing (larger size)
  const getPlayButtonStyle = () => {
    const isPressed = activeButtons.play;
    
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '52px',
      height: '52px',
      borderRadius: isPressed ? '50%' : '16px', // Morph to circle when pressed
      border: 'none',
      backgroundColor: hoveredButton === 'play' ? colors.playButtonHover : colors.playButton,
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: '20px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: hoveredButton === 'play' ? 'scale(1.08)' : 'scale(1)',
      boxShadow: hoveredButton === 'play' ? 
        '0 8px 24px rgba(139, 92, 246, 0.4)' : 
        '0 4px 16px rgba(139, 92, 246, 0.3)'
    };
  };

  return (
    <footer style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: colors.background,
      borderTop: `1px solid ${colors.border}`,
      boxShadow: colors.shadow,
      minHeight: '80px',
      gap: '20px'
    }}>
      {/* Left - Track Info */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: 0 // Allow flex children to shrink
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {trackName ? trackName.replace(/\.[^/.]+$/, '') : 'No track selected'}
        </div>
        <div style={{
          fontSize: '14px',
          color: colors.textSecondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {artistName || (trackName ? 'Unknown Artist' : 'Drop a file to start')}
        </div>
      </div>

      {/* Center - Controls (Always centered) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '12px'
      }}>
        {/* Previous */}
        <button
          style={getControlButtonStyle('previous')}
          onClick={() => handleButtonClick('previous', onPrevious)}
          onMouseEnter={() => setHoveredButton('previous')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Previous track"
        >
          ⏮️
        </button>

        {/* Play/Pause - Larger morphing button */}
        <button
          style={getPlayButtonStyle()}
          onClick={() => handleButtonClick('play', isPlaying ? onPause : onPlay)}
          onMouseEnter={() => setHoveredButton('play')}
          onMouseLeave={() => setHoveredButton(null)}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Next */}
        <button
          style={getControlButtonStyle('next')}
          onClick={() => handleButtonClick('next', onNext)}
          onMouseEnter={() => setHoveredButton('next')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Next track"
        >
          ⏭️
        </button>

        {/* Loop */}
        <button
          style={getControlButtonStyle('loop', loopEnabled)}
          onClick={() => handleButtonClick('loop', onLoop)}
          onMouseEnter={() => setHoveredButton('loop')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Loop track"
        >
          🔁
        </button>
      </div>

      {/* Right - Time */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0 // Allow flex children to shrink
      }}>
        <button
          onClick={() => setShowTimeRemaining(!showTimeRemaining)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            fontWeight: '500',
            color: colors.text,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            backgroundColor: hoveredButton === 'time' ? colors.buttonHover : 'transparent'
          }}
          onMouseEnter={() => setHoveredButton('time')}
          onMouseLeave={() => setHoveredButton(null)}
          title={showTimeRemaining ? 'Show elapsed time' : 'Show remaining time'}
        >
          {getDisplayTime()}
        </button>
        
        {duration > 0 && (
          <>
            <span style={{ 
              color: colors.textSecondary, 
              fontSize: '20px'
            }}>
              /
            </span>
            <span style={{ 
              fontSize: '20px',
              color: colors.textSecondary,
              fontWeight: '500',
              padding: '8px',
            }}>
              {formatTime(duration)}
            </span>
          </>
        )}
      </div>
    </footer>
  );
}

export default Footer;