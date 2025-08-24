import React from 'react';

const DebugDisplay = ({
  isMobile,
  currentBpm,
  activeAlbumTitle,
  isPlaying,
  isAudioReady,
  isTransitioning,
  wasPlayingBeforeChange,
  audioRef,
  dirtyAudioRef,
  isLandscape,
  isFullscreen
}) => {
  if (isMobile) {
    return null; // Hidden on mobile
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0,0,0,0.6)',
      color: 'white',
      padding: '5px',
      borderRadius: '3px',
      fontFamily: 'monospace',
      zIndex: 100,
      fontSize: '10px',
      pointerEvents: 'none'
    }}>
      <div>BPM: {currentBpm !== null ? currentBpm.toFixed(1) : 'N/A'}</div>
      <div>Album: {activeAlbumTitle || 'None'}</div>
      <div style={{ color: isPlaying ? 'lightgreen' : 'lightcoral' }}>Playing: {isPlaying ? 'Yes' : 'No'}</div>
      <div style={{ color: isAudioReady ? 'lightblue' : 'orange' }}>Audio Ready: {isAudioReady ? 'Yes' : 'No'}</div>
      <div>Trans Flag: {isTransitioning ? 'ON' : 'OFF'}</div>
      <div>Resume Play: {wasPlayingBeforeChange ? 'Yes' : 'No'}</div>
      <div>Clean Vol: {audioRef.current ? audioRef.current.volume.toFixed(2) : 'N/A'}</div>
      <div>Dirty Vol: {dirtyAudioRef.current ? dirtyAudioRef.current.volume.toFixed(2) : 'N/A'}</div>
      <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div>Landscape: {isLandscape ? 'Yes' : 'No'}</div>
      <div>Fullscreen: {isFullscreen ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default DebugDisplay; 