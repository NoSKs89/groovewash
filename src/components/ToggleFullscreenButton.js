import React, { useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

const ToggleFullscreenButton = ({ isFullscreen, isLandscape, onToggleFullscreenClick, isFullscreenApiEnabled, isMobile }) => {
  const [isToggleFullscreenHovered, setIsToggleFullscreenHovered] = useState(false);

  const buttonSpring = useSpring({
    from: {
      top: isMobile ? '1.75%' : '-5.75%',
    },
    to: {
      opacity: (isLandscape && isFullscreenApiEnabled) ? 1 : 0,
      top: '1.75%',
    },
    config: config.wobbly,
  });

  const toggleFullscreenButtonSpring = useSpring({
    opacity: (isLandscape && isFullscreenApiEnabled) ? 1 : 0,
    config: config.stiff,
  });

  return (
    <animated.div
      style={{
        ...toggleFullscreenButtonSpring,
        position: 'absolute',
        width: '10%',
        height: isMobile ? '10%' : '7.5%',
        top: buttonSpring.top,
        right: isMobile ? '2%' : '5.25%',
        background: isToggleFullscreenHovered ? '#FFD700' : 'rgba(0, 0, 0, 0.2)',
        color: isToggleFullscreenHovered ? '#333' : 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 50,
        pointerEvents: (isLandscape && isFullscreenApiEnabled) ? 'auto' : 'none',
        display: 'flex',
        fontSize: isMobile ? '0.8em' : '1em',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: 'bold',
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
      }}
      onClick={onToggleFullscreenClick}
      onMouseEnter={() => setIsToggleFullscreenHovered(true)}
      onMouseLeave={() => setIsToggleFullscreenHovered(false)}
    >
      {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    </animated.div>
  );
};

export default ToggleFullscreenButton; 