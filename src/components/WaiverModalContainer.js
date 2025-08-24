import React, { useState, useEffect, useRef } from 'react';
import { useSpring, useSpringRef, useChain, animated, config } from '@react-spring/web';
import WaiverForm from './WaiverForm'; // Assuming WaiverForm is in the same directory

const WaiverModalContainer = ({ activeModal, setActiveModal, isMobile, isLandscape, WAIVER_CONTENT }) => {
  const [isWaiverHovered, setIsWaiverHovered] = useState(false);
  const waiverHoverTimeoutRef = useRef(null);
  const [waiverName, setWaiverName] = useState('');
  const [waiverDate, setWaiverDate] = useState(new Date().toISOString().slice(0, 10));

  const isWaiverOpen = activeModal === 'waiver';
  const overflowStyle = 'hidden'; // As in App.js

  const waiverSpringRef = useSpringRef();
  const waiverFormTransRef = useSpringRef();

  const { borderRadius: waiverBR, width: waiverW, height: waiverH, borderWidth: waiverBW, background: waiverBG, transform: waiverT, ...waiverRest } = useSpring({
    ref: waiverSpringRef,
    config: isWaiverOpen ? config.stiff : { tension: 300, friction: 30 },
    from: {
      position: 'absolute', 
      width: '10%', 
      height: isMobile ? '10%' : '7.5%', 
      top: isMobile ? '1.75%' : '-5.75%', 
      left: isMobile ? '26.5%' : '28%', 
      border: 'none',
      background: 'rgba(0, 0, 0, 0.2)',
      borderWidth: (isMobile && isLandscape) ? '0px' : '2px',
      borderColor: 'transparent', borderStyle: 'solid',
      borderRadius: '5px', zIndex: 50, transform: 'translate(0%, 0%)'
    },
    to: {
      position: 'absolute', 
      width: isWaiverOpen ? isMobile ? '80%' : '66%' : '10%', 
      height: isWaiverOpen ? isMobile ? (isLandscape ? '77.5%' : '90%') : '95.25%' : isMobile ? '10%' : '7.5%', 
      border: 'auto',
      top: isWaiverOpen ? (isMobile && isLandscape) ? '1%' : '50%' : '1.75%', 
      left: isWaiverOpen ? '50%' : isMobile ? '26.5%' : '28%',
      marginBottom: isMobile && isWaiverOpen && !isLandscape ? '30%' : '0px',
      background: isWaiverOpen
        ? 'rgba(50, 50, 50, 0.8)'
        : isWaiverHovered
          ? '#FFD700'
          : 'rgba(0, 0, 0, 0.2)',
      borderWidth: isWaiverOpen ? '0px' : ((isMobile && isLandscape) ? '0px' : '2px'),
      borderColor: 'transparent', borderStyle: 'solid',
      borderRadius: isWaiverOpen ? '8px' : '5px', opacity: 1, zIndex: isWaiverOpen ? 1000 : 50,
      transform: isWaiverOpen 
        ? (isMobile && isLandscape) 
          ? 'translate(-50%, 0%)' // No vertical translation for mobile landscape 
          : 'translate(-50%, -50%)' 
        : 'translate(0%, 0%)'
    }
  });

  useChain(
    isWaiverOpen ? [waiverSpringRef, waiverFormTransRef] : [waiverFormTransRef, waiverSpringRef],
    [0, isWaiverOpen ? 0.3 : 0.0]
  );

  useEffect(() => {
    return () => {
      clearTimeout(waiverHoverTimeoutRef.current);
    };
  }, []);

  // Render nothing if mobile and portrait (this check might be redundant if App.js already handles it)
  // However, keeping it ensures the component is self-contained regarding this rule.
  if (isMobile && !isLandscape) {
    return null;
  }

  return (
    <animated.div
      style={{
        ...waiverRest,
        width: waiverW, height: waiverH, borderRadius: waiverBR, background: waiverBG,
        borderWidth: waiverBW, overflow: overflowStyle, borderColor: '#fff', borderStyle: 'solid',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: isWaiverOpen ? 'default' : 'pointer', transform: waiverT,
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
      }}
      onClick={() => { if (!isWaiverOpen) setActiveModal('waiver'); }}
      onMouseEnter={() => {
        if (!isWaiverOpen) {
          clearTimeout(waiverHoverTimeoutRef.current);
          setIsWaiverHovered(true);
          waiverHoverTimeoutRef.current = setTimeout(() => {
            setIsWaiverHovered(false);
          }, 5000);
        }
      }}
      onMouseLeave={() => {
        clearTimeout(waiverHoverTimeoutRef.current);
        setIsWaiverHovered(false);
      }}
    >
      {!isWaiverOpen && (
          <span style={{
            color: isWaiverHovered ? '#333' : '#fff',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            fontSize: isMobile ? '0.8em' : '1em'
          }}>
              Sign Waiver
          </span>
      )}
      <WaiverForm
          isWaiverOpen={isWaiverOpen} // This prop name matches existing WaiverForm
          name={waiverName} setName={setWaiverName}
          date={waiverDate} setDate={setWaiverDate}
          onClose={() => setActiveModal(null)}
          formTransRef={waiverFormTransRef}
          waiverText={WAIVER_CONTENT}
      />
    </animated.div>
  );
};

export default WaiverModalContainer; 