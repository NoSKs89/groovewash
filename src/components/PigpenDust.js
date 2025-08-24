import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// Extend Three.js with MeshLine components
extend({ MeshLineGeometry, MeshLineMaterial });

// Define default Pigpen colors (kept for reference, but not used for base color anymore)
// const defaultColors = ['#5C3A21', '#402A1A', '#2E1F13', '#1C120B', '#000000'];

const PigpenDust = ({
  count,
  radius,
  dashRatio,
  dashArray,
  lineWidth,
  lineWidthVariance,
  speedFactor,
  // Keep defaults for uncontrolled props
  // colors = defaultColors, // Removed as baseColor is now controlled
  position = [0, 0, 0], // Base position for the effect
  // Add new emissive props
  emissive = 'white', // Default to black (no emission)
  emissiveIntensity = 1,
  // Add baseColor prop
  baseColor = 'white' // Default base color if not provided
}) => {

  const lines = useMemo(() => {
    const rand = THREE.MathUtils.randFloatSpread; // Helper for random values centered at 0
    const randFloat = THREE.MathUtils.randFloat; // Helper for positive random values

    return Array.from({ length: count }, () => {
      // Create short, somewhat erratic line segments
      const startPos = new THREE.Vector3(rand(radius * 2), rand(radius * 1.5), rand(radius * 2)); // More spread initially
      const points = [];
      const numSegments = 3 + Math.floor(Math.random() * 4); // 3 to 6 segments per stroke
      let currentPos = startPos.clone();
      points.push(currentPos.clone());

      for (let i = 0; i < numSegments; i++) {
        // Add small random deviations for the next point
        const nextPos = currentPos.add(
          new THREE.Vector3(rand(radius * 0.3), rand(radius * 0.2), rand(radius * 0.3))
        );
        points.push(nextPos.clone());
        currentPos = nextPos;
      }

      // Use a CatmullRomCurve for slight smoothing, generate points along it
      const curve = new THREE.CatmullRomCurve3(points).getPoints(30); // Fewer points for simpler strokes

      return {
        // Remove color selection here, it will be passed directly to DustStroke
        // color: colors[Math.floor(randFloat(0, colors.length))],
        width: Math.max(0.01, lineWidth + randFloat(-lineWidthVariance / 2, lineWidthVariance / 2)), // Apply random width variance
        speed: Math.max(0.1, speedFactor * randFloat(0.5, 1.5)), // Randomize speed slightly
        curvePoints: curve, // Store the Vector3 points
      };
    });
  }, [count, radius, lineWidth, lineWidthVariance, speedFactor]);

  return (
    <group position={position}>
      {lines.map((props, index) => (
        <DustStroke 
          key={index} 
          {...props} // Pass width, speed, curvePoints
          dashRatio={dashRatio} 
          dashArray={dashArray} 
          emissive={emissive} 
          emissiveIntensity={emissiveIntensity} 
          // Pass the single baseColor down
          baseColor={baseColor} 
        />
      ))}
    </group>
  );
};

// Accept baseColor, remove old color prop
function DustStroke({ curvePoints, width, speed, dashRatio, dashArray, emissive, emissiveIntensity, baseColor }) {
  const materialRef = useRef();
  const meshRef = useRef(); // Ref for the mesh itself for jitter

  // Animate the dash offset and add position jitter
  useFrame((state, delta) => {
    // Animate dash
    if (materialRef.current) {
      materialRef.current.uniforms.dashOffset.value -= (delta * speed);
    }
    // Add position jitter
    if (meshRef.current) {
        const jitterAmount = 0.005; // Adjust for desired jitter strength
        meshRef.current.position.x += (Math.random() - 0.5) * jitterAmount;
        meshRef.current.position.y += (Math.random() - 0.5) * jitterAmount;
        meshRef.current.position.z += (Math.random() - 0.5) * jitterAmount;
    }
  });

  // Convert Vector3 points to flat array for MeshLineGeometry
  const flatPoints = useMemo(() => curvePoints.flatMap(p => p.toArray()), [curvePoints]);

  return (
    <mesh ref={meshRef}> {/* Attach mesh ref */}
      {/* Use MeshLineGeometry with the flattened points */}
      <meshLineGeometry points={flatPoints} />
      {/* Use MeshLineMaterial for the dashed line appearance */}
      <meshLineMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        lineWidth={width}
        // Use baseColor prop for the material color
        color={baseColor}
        dashArray={dashArray}   // Length of dashes and gaps
        dashRatio={dashRatio}   // Ratio of dash length to total length (dash + gap)
        toneMapped={false}      // Often better for emissive/bright effects
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

export default PigpenDust; 