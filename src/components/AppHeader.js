// src/components/AppHeader.js
import React, { useMemo } from 'react';
import { useSpring, animated, config as springConfig } from '@react-spring/web';
import { useSpring as useSpringThree, animated as animatedThree } from '@react-spring/three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import LogoParticles from './LogoParticles';
// We don't need to import GrooveWashLogo.svg here for an <img> tag anymore

const AppHeader = ({ isAppLoaded, isMobile, isLandscape, audioRef, isPlaying, audioContext, sourceNode }) => {

  // Define configuration object instead of using Leva
  const particleConfig = useMemo(() => ({
    // Existing mobile checks
    amount: isMobile ? !isLandscape ? 8000 : 4600 : 4600,
    resolution: isMobile ? 160 : 130,
    density: isMobile ? !isLandscape ? 8 : 7 : 7,
    topDotSize: isMobile ? 2 : 2.5,
    bottomDotSize: isMobile ? 3 : 5,
    displacementStrength: isMobile ? 8 : 6,
    // Updated Mobile Logo Position
    positionX: isMobile ? 25 : 170,
    positionY: isMobile ? !isLandscape ? -175 : 47.5 : -25,
    positionZ: isMobile ? 22.5 : 0,
    // Standard non-mobile values (previously from Leva)
    bottomHeightDivider: 0.31,
    middleHeightDivider: 0.65,
    topHeightDivider: 0.90,
    bottomColor: '#f2f2f2',
    middleColor: '#008080',
    topColor: '#CEAF00',
    animateMiddleColor: true,
    middleColorShiftSpeed: 0.8,
    middleColorShiftRange: 0.15,
    animateTopColor: true,
    topColorShiftSpeed: 0.4,
    topColorShiftRange: 0.09,
    noiseScale: 0.03,
    noiseSpeed: 0.42,
    interactionRadius: 58,
    pushStrength: 49,
    bubbleStrength: 35,
    interactionDecayTime: 4,
    // Visualizer Transform (with new mobile values)
    visualizerPosX: isMobile ? 14 : 10,
    visualizerPosY: isMobile ? 14.5 : -100,
    visualizerPosZ: isMobile ? 110 : 110, // Keep Z same for mobile/desktop unless specified
    visualizerRotX: isMobile ? 30 : 30,
    visualizerRotY: isMobile ? -140 : -140,
    visualizerRotZ: isMobile ? 10.5 : 13.5,
    // Visualizer Appearance (standard values)
    visualizerBaselineY: 200,
    visualizerHeightScale: 172,
    visualizerWidth: 500,
    visualizerFftSize: 1024,
    visualizerSmoothing: 0,
    visualizerOverallScale: 5.1,
    visualizerColor: 'gold',
  }), [isMobile, isLandscape]); // Recompute when isMobile or isLandscape changes

  // Destructure values from the new config object
  const {
    amount, resolution, density, positionX, positionY, positionZ,
    topDotSize, bottomDotSize, bottomHeightDivider, middleHeightDivider, topHeightDivider,
    bottomColor, middleColor, topColor,
    noiseScale, noiseSpeed, displacementStrength,
    interactionRadius, pushStrength, bubbleStrength, interactionDecayTime,
    animateMiddleColor, middleColorShiftSpeed, middleColorShiftRange,
    animateTopColor, topColorShiftSpeed, topColorShiftRange,
    visualizerPosX, visualizerPosY, visualizerPosZ, visualizerRotX, visualizerRotY, visualizerRotZ,
    visualizerBaselineY, visualizerHeightScale, visualizerWidth, visualizerFftSize,
    visualizerSmoothing, visualizerOverallScale, visualizerColor,
  } = particleConfig;

  const headerSpring = useSpring({
    opacity: isAppLoaded ? 1 : 0,
    transform: isAppLoaded ? 'translateY(0px)' : 'translateY(-100px)',
    delay: 700,
    config: springConfig.wobbly,
  });

  // Use values from particleConfig for the spring animation
  const groupTransformSpring = useSpringThree({
    to: {
      position: isPlaying ? [visualizerPosX, visualizerPosY, visualizerPosZ] : [positionX, positionY, positionZ],
      rotation: isPlaying
        ? [
            THREE.MathUtils.degToRad(visualizerRotX),
            THREE.MathUtils.degToRad(visualizerRotY),
            THREE.MathUtils.degToRad(visualizerRotZ)
          ]
        : [0, 0, 0],
    },
    config: springConfig.gentle,
  });

  // Use values from particleConfig here
  const particleProcessingOptions = useMemo(() => ({
    amount,
    resolution,
    density,
  }), [amount, resolution, density]);

  const canvasWidth = isMobile ? '300px' : '500px';
  let canvasHeight;
  if (isMobile) {
    if (!isLandscape) {
      canvasHeight = '200px'; // Taller height for mobile portrait
    } else {
      canvasHeight = '150px'; // Original mobile landscape height
    }
  } else {
    canvasHeight = '250px'; // Original desktop height
  }

  return (
    <>
      {/* REMOVE Leva component */}
      {/* <Leva collapsed={false} titleBar={{ title: "Logo Controls" }} hidden={true} /> */}
      
      <animated.div
        style={{
          ...headerSpring,
          position: 'absolute',
          top: '0%',
          left: '50%',
          transform: headerSpring.transform.to(t => `translateX(-50%) ${t}`),
          zIndex: 100,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: canvasWidth,
          height: canvasHeight,
        }}
        className="no-select"
      >
        <Canvas camera={{ position: [0, 0, isMobile ? 1000 : 700], fov: 50 }} style={{width: '100%', height: '100%', backgroundColor: 'transparent'}}>
          <ambientLight intensity={0.8} />
          <pointLight position={[density * 5, density * 5, density * 10]} intensity={1.2} />
          
          <Center>
            <animatedThree.group
              position={groupTransformSpring.position}
              rotation={groupTransformSpring.rotation}
            >
              {/* Pass props destructured from particleConfig */}
              <LogoParticles
                audioRef={audioRef}
                isPlaying={isPlaying}
                audioContext={audioContext}
                sourceNode={sourceNode}
                particleOptions={particleProcessingOptions}
                bottomHeightDivider={bottomHeightDivider}
                middleHeightDivider={middleHeightDivider}
                topHeightDivider={topHeightDivider}
                bottomColor={bottomColor}
                middleColor={middleColor}
                topColor={topColor}
                topDotSize={topDotSize}
                bottomDotSize={bottomDotSize}
                noiseScale={noiseScale}
                noiseSpeed={noiseSpeed}
                displacementStrength={displacementStrength}
                interactionRadius={interactionRadius}
                pushStrength={pushStrength}
                bubbleStrength={bubbleStrength}
                interactionDecayTime={interactionDecayTime}
                logoPosition={groupTransformSpring.position} // Still animated
                animateMiddleColor={animateMiddleColor}
                middleColorShiftSpeed={middleColorShiftSpeed}
                middleColorShiftRange={middleColorShiftRange}
                animateTopColor={animateTopColor}
                topColorShiftSpeed={topColorShiftSpeed}
                topColorShiftRange={topColorShiftRange}
                visualizerBaselineY={visualizerBaselineY}
                visualizerHeightScale={visualizerHeightScale}
                visualizerWidth={visualizerWidth}
                visualizerFftSize={visualizerFftSize}
                visualizerSmoothing={visualizerSmoothing}
                visualizerOverallScale={visualizerOverallScale}
                visualizerColor={visualizerColor}
              />
            </animatedThree.group>
          </Center>
          
        </Canvas>
      </animated.div>
    </>
  );
};

export default AppHeader;