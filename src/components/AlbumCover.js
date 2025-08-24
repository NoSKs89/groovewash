import React, { forwardRef } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring, animated, config } from '@react-spring/three';

const AlbumCover = forwardRef((
  {
    imageUrl,
    targetPosition,
    targetRotationRad,
    targetScale,
    isVinylFocused,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerOver,
    onPointerOut,
    ...props
  },
  ref
) => {
  // Load the texture
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  // Ensure texture wraps correctly and isn't blurry
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Or ClampToEdgeWrapping
  texture.repeat.set(1, 1);
  texture.anisotropy = 16; // Improve texture quality at angles
  texture.needsUpdate = true;

  // Use dimensions that make sense relative to a vinyl record (approx 1:1 aspect ratio)
  // Keep depth minimal
  const boxArgs = [1, 1, 0.02]; // Width, Height, Depth

  // Animate opacity based on vinyl focus
  const { opacity } = useSpring({
    opacity: isVinylFocused ? 0 : 1,
    config: { tension: 300, friction: 30 },
  });
  
  // Animate position, rotation, AND scale towards targets
  const { position, rotation, scale } = useSpring({
    to: { 
      position: targetPosition, 
      rotation: targetRotationRad,
      scale: targetScale
    },
    config: config.wobbly, // Or another config like config.gentle
  });

  return (
    <animated.mesh
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerCancel={onPointerUp}
      castShadow
      {...props}
    >
      <boxGeometry args={boxArgs} />
      {/* Use animated.meshStandardMaterial and make it transparent */}
      <animated.meshStandardMaterial 
        map={texture} 
        side={THREE.FrontSide} 
        transparent // Needs to be transparent to fade
        opacity={opacity} // Apply animated opacity
      />
    </animated.mesh>
  );
});

// Memoize the forwardRef component before exporting
const MemoizedAlbumCover = React.memo(AlbumCover);

export default MemoizedAlbumCover; 