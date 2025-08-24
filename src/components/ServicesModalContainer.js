import React, { useState, useEffect, useRef } from 'react';
import { useSpring, useSpringRef, useChain, animated, config } from '@react-spring/web';
import Services from './Services'; // Assuming Services is in the same directory

const ServicesModalContainer = ({ activeModal, setActiveModal, isMobile, isLandscape }) => {
  const [isServicesHovered, setIsServicesHovered] = useState(false);
  const servicesHoverTimeoutRef = useRef(null);

  const isServicesOpen = activeModal === 'services';
  const overflowStyle = 'hidden';

  const servicesSpringRef = useSpringRef();
  const servicesTransRef = useSpringRef();

  const { borderRadius: servicesBR, width: servicesW, height: servicesH, borderWidth: servicesBW, background: servicesBG, transform: servicesT, ...servicesRest } = useSpring({
    ref: servicesSpringRef,
    config: isServicesOpen ? config.stiff : { tension: 300, friction: 30 },
    from: {
      position: 'absolute', width: '10%', height: isMobile ? '10%' : '7.5%', top: isMobile ? '1.75%' : '-5.75%', left: isMobile ? '2.5%' : '5%', border: 'none',
      background: 'rgba(0, 0, 0, 0.2)',
      borderWidth: (isMobile && isLandscape) ? '0px' : '2px',
      borderColor: '#fff', borderStyle: 'solid',
      borderRadius: '5px', opacity: isMobile ? 1 : 0, zIndex: 50, transform: 'translate(0%, 0%)'
    },
    to: {
      position: 'absolute', 
      width: isServicesOpen ? isMobile ? '80%' : '50%' : '10%', 
      height: isServicesOpen ? isMobile ? (isLandscape ? '77.55%' : '50%') : '89.25%' : isMobile ? '10%' : '7.5%', 
      border: 'auto',
      marginBottom: isMobile && isServicesOpen && !isLandscape ? '30px' : '0px',
      top: isServicesOpen ? (isMobile && isLandscape) ? '1%' : '50%' : '1.75%', 
      left: isServicesOpen ? '50%' : isMobile ? '2.5%' : '5%',
      background: isServicesOpen
        ? 'rgba(70, 70, 70, 0.9)'
        : isServicesHovered
          ? '#FFD700'
          : 'rgba(0, 0, 0, 0.2)',
      borderWidth: isServicesOpen ? '0px' : ((isMobile && isLandscape) ? '0px' : '2px'),
      borderColor: '#fff', borderStyle: 'solid',
      borderRadius: isServicesOpen ? '8px' : '5px', opacity: 1, zIndex: isServicesOpen ? 1000 : 50,
      transform: isServicesOpen 
        ? (isMobile && isLandscape) 
          ? 'translate(-50%, 0%)'
          : 'translate(-50%, -50%)' 
        : 'translate(0%, 0%)'
    },
  });

  useChain(
    isServicesOpen ? [servicesSpringRef, servicesTransRef] : [servicesTransRef, servicesSpringRef],
    [0, isServicesOpen ? 0.3 : 0.0]
  );

  useEffect(() => {
    return () => {
      clearTimeout(servicesHoverTimeoutRef.current);
    };
  }, []);

  if (isMobile && !isLandscape) {
    return null;
  }

  return (
    <animated.div
      style={{
        ...servicesRest,
        width: servicesW, height: servicesH, borderRadius: servicesBR, background: servicesBG,
        borderWidth: servicesBW, overflow: overflowStyle, borderColor: '#fff', borderStyle: 'solid',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: isServicesOpen ? 'default' : 'pointer', transform: servicesT,
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
      }}
      onClick={() => { if (!isServicesOpen) setActiveModal('services'); }}
      onMouseEnter={() => {
        if (!isServicesOpen) {
          clearTimeout(servicesHoverTimeoutRef.current);
          setIsServicesHovered(true);
          servicesHoverTimeoutRef.current = setTimeout(() => {
            setIsServicesHovered(false);
          }, 5000);
        }
      }}
      onMouseLeave={() => {
        clearTimeout(servicesHoverTimeoutRef.current);
        setIsServicesHovered(false);
      }}
    >
      {!isServicesOpen && (
          <span style={{
            color: isServicesHovered ? '#333' : '#fff',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            fontSize: isMobile ? '0.8em' : '1em'
          }}>
              Services
          </span>
      )}
      <Services
          isServicesOpen={isServicesOpen} // Prop name for Services component
          onClose={() => setActiveModal(null)}
          servicesTransRef={servicesTransRef}
      />
    </animated.div>
  );
};

export default ServicesModalContainer; 