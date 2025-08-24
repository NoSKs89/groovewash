import React, { useState, useEffect, useRef } from 'react';
import { useSpring, useTransition, animated, config, interpolate } from '@react-spring/web';

const CleanDirtyToggleButton = ({ isMobile, isLandscape, isClean, setIsClean }) => {
  const [isCleanHovered, setIsCleanHovered] = useState(false);
  const [isCleanFlashing, setIsCleanFlashing] = useState(false);
  const cleanHoverTimeoutRef = useRef(null);
  const cleanFlashTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(cleanHoverTimeoutRef.current);
      clearTimeout(cleanFlashTimeoutRef.current);
    };
  }, []);

  // Add spring animation for button appearance
  const buttonSpring = useSpring({
    from: {
      top: '-5.75%',
    },
    to: {
      opacity: 1,
      top: '1.75%',
    },
    config: config.wobbly,
  });

  const cleanButtonBackgroundSpring = useSpring({
    border: 'none',
    background: isCleanFlashing
      ? 'teal'
      : isCleanHovered
        ? '#FFD700'
        :
          'rgba(0, 0, 0, 0.2)',
    config: config.molasses,
  });

  const cleanTextTransitions = useTransition(isClean, {
    from: { opacity: 0, scale: 0.5, x: 0, y: 250, position:'absolute' },
    enter: { opacity: 1, scale: 1, x: 0, y: 0 },
    leave: { opacity: 0, scale: 0.5, x: 0, y: -250, position:'absolute' },
    config: config.wobbly,
    initial: null,
  });

  // Render nothing if mobile and portrait
  if (isMobile && !isLandscape) {
    return null;
  }

  return (
    <animated.div
      style={{
        position: 'absolute',
        // Replace static values with spring values
        top: buttonSpring.top,
        right: isMobile ? '26%' : '28.25%',
        width: '10%',
        height: isMobile ? '10%' : '7.5%',
        border: '2px solid #fff',
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: 50,
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        opacity: buttonSpring.opacity,
        ...cleanButtonBackgroundSpring,
      }}
      onClick={() => {
        clearTimeout(cleanFlashTimeoutRef.current);
        const nextCleanState = !isClean;
        setIsClean(nextCleanState);
        setIsCleanFlashing(true);
        cleanFlashTimeoutRef.current = setTimeout(() => {
          setIsCleanFlashing(false);
        }, 150);
      }}
      onMouseEnter={() => {
        clearTimeout(cleanHoverTimeoutRef.current);
        setIsCleanHovered(true);
        cleanHoverTimeoutRef.current = setTimeout(() => {
          setIsCleanHovered(false);
        }, 5000);
      }}
      onMouseLeave={() => {
        clearTimeout(cleanHoverTimeoutRef.current);
        setIsCleanHovered(false);
      }}
    >
      <div style={{
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
      }}>
        {cleanTextTransitions((styles, item) => {
          const { opacity, scale, x, y, position, top, left } = styles;
          
          return (
            <animated.span style={{
              opacity,
              position,
              top,
              left,
              transform: interpolate([x, y, scale], (xVal, yVal, scaleVal) => {
                if (position && typeof position.get === 'function' && position.get() === 'absolute') {
                  return `translate(${xVal}%, ${yVal}%) scale(${scaleVal})`;
                }
                return `scale(${scaleVal})`;
              }),
              color: 'white',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              fontSize: isMobile ? '0.8em' : '1em',
            }}>
              Playing <br/>
              {item ? 'Clean' : 'Dirty'}
            </animated.span>
          );
        })}
      </div>
    </animated.div>
  );
};

export default CleanDirtyToggleButton; 