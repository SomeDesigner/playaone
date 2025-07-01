import { useState } from 'react';

function PlaylistSidebar({ 
  isOpen = false, 
  onClose, 
  currentTrack = null,
  onTrackSelect,
  playlist = [],
  theme = 'light' 
}) {
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme styles
  const themeStyles = {
    light: {
      background: '#ffffff',
      border: '#e5e5e5',
      text: '#333333',
      textSecondary: '#666666',
      hover: '#f8f9fa',
      active: '#8B5CF6',
      activeText: '#ffffff',
      searchBg: '#f8f9fa',
      shadow: '2px 0 12px rgba(0, 0, 0, 0.1)'
    },
    dark: {
      background: '#1a1a1a',
      border: '#333333',
      text: '#ffffff',
      textSecondary: '#cccccc',
      hover: '#2a2a2a',
      active: '#8B5CF6',
      activeText: '#ffffff',
      searchBg: '#2a2a2a',
      shadow: '2px 0 12px rgba(0, 0, 0, 0.3)'
    }
  };

  const colors = themeStyles[theme];

  // Sample playlist data (you'll replace this with real data)
  const samplePlaylist = [
    { id: 1, title: 'NEVER ENOUGH', artist: 'Turnstile', duration: '3:29', isPlaying: true },
    { id: 2, title: "I can't go for that", artist: 'The bird and the bee', duration: '4:12', isPlaying: false },
    { id: 3, title: 'The Birds and the Bongos', artist: 'Pitchy & Scratchy', duration: '2:58', isPlaying: false },
    { id: 4, title: '1979', artist: 'The Smashing Pumpkins', duration: '4:21', isPlaying: false },
    { id: 5, title: 'Johnny remember me', artist: 'John Leyton', duration: '3:45', isPlaying: false },
    { id: 6, title: 'Feelings', artist: 'Cuco', duration: '3:12', isPlaying: false },
    { id: 7, title: 'The Climb', artist: 'Flying Lotus, Thundercat', duration: '5:33', isPlaying: false },
    { id: 8, title: 'Freelance', artist: 'Toro y Moi', duration: '4:07', isPlaying: false },
    { id: 9, title: 'Borderline', artist: 'Tame Impala', duration: '3:58', isPlaying: false },
    { id: 10, title: 'Figure it out - Nite Edit', artist: 'Ekkah', duration: '4:44', isPlaying: false },
    { id: 11, title: 'Youth Blood', artist: 'Little Jinder', duration: '3:21', isPlaying: false }
  ];

  const displayPlaylist = playlist.length > 0 ? playlist : samplePlaylist;

  // Filter playlist based on search
  const filteredPlaylist = displayPlaylist.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 40
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: colors.background,
          borderRight: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: colors.text
          }}>
            My Playlist
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: colors.textSecondary,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.hover}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              fontSize: '16px',
              color: colors.textSecondary
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                backgroundColor: colors.searchBg,
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
              onBlur={(e) => e.target.style.borderColor = colors.border}
            />
          </div>
        </div>

        {/* Playlist */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0'
        }}>
          {filteredPlaylist.map((track, index) => (
            <div
              key={track.id}
              onClick={() => onTrackSelect && onTrackSelect(track)}
              onMouseEnter={() => setHoveredTrack(track.id)}
              onMouseLeave={() => setHoveredTrack(null)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                backgroundColor: track.isPlaying ? colors.active :
                                hoveredTrack === track.id ? colors.hover : 'transparent',
                borderLeft: track.isPlaying ? '4px solid #8B5CF6' : '4px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Track Number / Playing Indicator */}
              <div style={{
                width: '20px',
                fontSize: '12px',
                color: track.isPlaying ? colors.activeText : colors.textSecondary,
                textAlign: 'center',
                fontWeight: track.isPlaying ? '600' : '400'
              }}>
                {/* Playing Animation */}
              {track.isPlaying && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '1px'
                }}>
                  <div style={{
                    width: '2px',
                    height: '8px',
                    backgroundColor: colors.activeText,
                    animation: 'bounce 1.4s ease-in-out infinite both',
                    animationDelay: '0s'
                  }} />
                  <div style={{
                    width: '2px',
                    height: '12px',
                    backgroundColor: colors.activeText,
                    animation: 'bounce 1.4s ease-in-out infinite both',
                    animationDelay: '0.16s'
                  }} />
                  <div style={{
                    width: '2px',
                    height: '6px',
                    backgroundColor: colors.activeText,
                    animation: 'bounce 1.4s ease-in-out infinite both',
                    animationDelay: '0.32s'
                  }} />
                </div>
              )}

              </div>

              {/* Track Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: track.isPlaying ? '600' : '500',
                  color: track.isPlaying ? colors.activeText : colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '2px'
                }}>
                  {track.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: track.isPlaying ? colors.activeText : colors.textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.artist}
                </div>
              </div>

              {/* Duration */}
              <div style={{
                fontSize: '12px',
                color: track.isPlaying ? colors.activeText : colors.textSecondary,
                fontWeight: '500'
              }}>
                {track.duration}
              </div>

              
            </div>
          ))}
        </div>

        {/* Add Music Button */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`
        }}>
          <button
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px dashed ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8B5CF6';
              e.target.style.color = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = colors.border;
              e.target.style.color = colors.textSecondary;
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Add Music
          </button>
        </div>
      </div>

      {/* CSS Animation for playing indicator */}
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scaleY(0.4);
            }
            40% {
              transform: scaleY(1.0);
            }
          }
        `}
      </style>
    </>
  );
}

export default PlaylistSidebar;