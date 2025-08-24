import React, { useState, useEffect, useRef } from 'react';
import { useSpring, useSpringRef, useChain, animated, config } from '@react-spring/web';
import Credits from './Credits'; // Import the Credits component

const CreditsModalContainer = ({ activeModal, setActiveModal, isMobile, isLandscape }) => {
  const [isCreditsHovered, setIsCreditsHovered] = useState(false);
  const creditsHoverTimeoutRef = useRef(null);

  const isCreditsOpen = activeModal === 'credits';
  const overflowStyle = 'hidden'; // Keep consistent with FAQ

  const creditsSpringRef = useSpringRef();
  const creditsTransRef = useSpringRef();

  // Position from the right
  const buttonRightPosition =  isMobile ? '14%' : '16.75%'; // Example: 1% (Fullscreen margin) + 10% (Fullscreen width) + 1% (margin)

  const { borderRadius: creditsBR, width: creditsW, height: creditsH, borderWidth: creditsBW, background: creditsBG, transform: creditsT, ...creditsRest } = useSpring({
    ref: creditsSpringRef,
    config: isCreditsOpen ? config.stiff : { tension: 300, friction: 30 },
    from: {
      position: 'absolute', width: '10%', height: isMobile ? '10%' : '7.5%', top: isMobile ? '1.75%' : '-5.75%', 
      right: buttonRightPosition, 
      border: 'none',
      background: 'rgba(0, 0, 0, 0.2)',
      borderWidth: (isMobile && isLandscape) ? '0px' : '2px',
      borderColor: '#fff', borderStyle: 'solid',
      borderRadius: '5px', zIndex: 50, transform: 'translate(0%, 0%)'
    },
    to: {
      position: 'absolute',
      width: isCreditsOpen ? isMobile ? '80%' : '45%' : '10%',
      height: isCreditsOpen ? isMobile ? (isLandscape ? '77.5%' : '90%') : '80.5%' : isMobile ? '10%' : '7.5%',
      marginBottom: isMobile && isCreditsOpen && !isLandscape ? '30px' : '0px',
      border: 'auto',
      top: isCreditsOpen ? (isMobile && isLandscape) ? '1%' : '50%' : '1.75%',
      right: isCreditsOpen ? '50%' : buttonRightPosition,
      background: isCreditsOpen
        ? 'rgba(60, 60, 60, 0.85)'
        : isCreditsHovered
          ? '#FFD700' // Gold hover
          : 'rgba(0, 0, 0, 0.2)',
      borderWidth: isCreditsOpen ? '0px' : ((isMobile && isLandscape) ? '0px' : '2px'),
      borderColor: '#fff', borderStyle: 'solid',
      borderRadius: isCreditsOpen ? '8px' : '5px',
      opacity: 1,
      zIndex: isCreditsOpen ? 1000 : 50,
      transform: isCreditsOpen 
        ? (isMobile && isLandscape) 
          ? 'translate(50%, 0%)' // No vertical translation for mobile landscape, but keep horizontal transform
          : 'translate(50%, -50%)' 
        : 'translate(0%, 0%)'
    }
  });

  useChain(
    isCreditsOpen ? [creditsSpringRef, creditsTransRef] : [creditsTransRef, creditsSpringRef],
    [0, isCreditsOpen ? 0.3 : 0.0]
  );

  useEffect(() => {
    return () => {
      clearTimeout(creditsHoverTimeoutRef.current);
    };
  }, []);

  if (isMobile && !isLandscape) {
    return null;
  }

  return (
    <animated.div
      style={{
        ...creditsRest,
        width: creditsW, height: creditsH, borderRadius: creditsBR, background: creditsBG,
        borderWidth: creditsBW, overflow: overflowStyle, borderColor: '#fff', borderStyle: 'solid',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: isCreditsOpen ? 'default' : 'pointer', transform: creditsT,
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
      }}
      onClick={() => { if (!isCreditsOpen) setActiveModal('credits'); }}
      onMouseEnter={() => {
        if (!isCreditsOpen) {
          clearTimeout(creditsHoverTimeoutRef.current);
          setIsCreditsHovered(true);
          creditsHoverTimeoutRef.current = setTimeout(() => {
            setIsCreditsHovered(false);
          }, 5000); // Keep hover effect for 5 seconds unless mouse leaves
        }
      }}
      onMouseLeave={() => {
        clearTimeout(creditsHoverTimeoutRef.current);
        setIsCreditsHovered(false);
      }}
    >
      {!isCreditsOpen && (
          <span style={{
            color: isCreditsHovered ? '#333' : '#fff', // Dark text on gold, white on transparent
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            fontSize: isMobile ? '0.8em' : '1em'
          }}>
              Credits
          </span>
      )}
      <Credits
          isCreditsOpen={isCreditsOpen}
          onClose={() => setActiveModal(null)}
          creditsTransRef={creditsTransRef} // Pass the transition ref
      />
    </animated.div>
  );
};

export default CreditsModalContainer; 