import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import { useFrame } from '@react-three/fiber';

// Accept bpm and new freqData prop
const SpiderWeb = ({ bpm = 60, freqData = [0, 0, 0] }) => {
  const groupRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef(); // Ref for the material
  const originalPositions = useRef(null);
  const lastBeatTime = useRef(0);
  const beatCount = useRef(0); // Counter for beats
  const lastIntensityPulseTime = useRef(-Infinity); // Track intensity pulse trigger
  const lastColorPulseTime = useRef(-Infinity); // Track color pulse trigger

  const webControls = useControls('Spider Web', {
    // --- Positioning & Base Appearance ---
    position: { value: [-0.5, -0.2, -2.0], min: -50, max: 50, step: 0.1, label: 'Position' },
    rotation: { value: [-0.2, -3.0, -0.5], min: -Math.PI * 4, max: Math.PI * 4, step: 0.1, label: 'Rotation' },
    scale: { value: 2.1, min: 0.01, max: 30, step: 0.1, label: 'Scale' },
    baseColor: { value: '#ffd700', label: 'Base Color (Non-Bloom)' },
    emissiveColor: { value: '#ffffff', label: 'Bloom Color (Base)' },
    emissiveIntensity: { value: 1.5, min: 0, max: 50, step: 0.1, label: 'Bloom Intensity (Base)' },
    // --- Structure ---
    numPoints: { value: 450, min: 5, max: 3000, step: 10, label: 'Strand Points' },
    volumeSize: { value: [4, 2, 1.5], min: 0.1, max: 30, step: 0.1, label: 'Volume Size' },
    maxDistance: { value: 0.8, min: 0.05, max: 10, step: 0.1, label: 'Max Connect Dist' },
    maxConnections: { value: 3, min: 1, max: 30, step: 1, label: 'Max Connections/Pt' },
    // --- RTA Visualizer Controls ---
    lowFreqMultiplier: { value: 1.0, min: 0, max: 5, step: 0.1, label: 'Low Freq Amp' },
    midFreqMultiplier: { value: 0.8, min: 0, max: 5, step: 0.1, label: 'Mid Freq Amp' },
    highFreqMultiplier: { value: 0.6, min: 0, max: 5, step: 0.1, label: 'High Freq Amp' },
    freqIntensityFactor: { value: 0.5, min: 0, max: 3, step: 0.05, label: 'Freq Intensity Factor' }, // How much freq affects base intensity
    maxRadiusForFreqMapping: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Freq Map Radius' }, // Scale freq mapping spatially
    // --- Beat Pulse FX --- 
    pulseDuration: { value: 0.27, min: 0.01, max: 2.0, step: 0.01, label: 'Beat FX Duration' }, // Duration for intensity/color pulses
    pulseIntensityMax: { value: 8.0, min: 0, max: 100, step: 0.1, label: 'Beat Intensity Max' },
    pulseColor: { value: '#00FFFF', label: 'Beat Color' }
    // Removed old ripple controls (pulseAmplitude, pulseFrequency)
  }, { collapsed: false });

  // Memoize material creation separately
  useMemo(() => {
    materialRef.current = new THREE.MeshStandardMaterial({
        color: webControls.baseColor,
        emissive: webControls.emissiveColor,
        emissiveIntensity: webControls.emissiveIntensity,
        transparent: true,
        opacity: 0.75,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
  }, []); // Create material once

  // Update non-geometry material properties when controls change
  useEffect(() => {
      if (!materialRef.current) return;
      materialRef.current.color.set(webControls.baseColor);
      // Base emissive color/intensity set here, animation overrides in useFrame
      materialRef.current.emissive.set(webControls.emissiveColor);
      materialRef.current.emissiveIntensity = webControls.emissiveIntensity;
  }, [webControls.baseColor, webControls.emissiveColor, webControls.emissiveIntensity]);

  // Regenerate geometry only when structural controls change
  useMemo(() => {
    const strandPoints = [];
    const numPts = Math.round(webControls.numPoints);
    const size = webControls.volumeSize;
    for (let i = 0; i < numPts; i++) {
        strandPoints.push(
            new THREE.Vector3(
                (Math.random() - 0.5) * size[0],
                (Math.random() - 0.5) * size[1],
                (Math.random() - 0.5) * size[2]
            )
        );
    }
    const linePoints = [];
    const connections = new Map();
    for (let i = 0; i < numPts; i++) {
        let currentConnections = 0;
        if (!connections.has(i)) connections.set(i, 0);
        currentConnections = connections.get(i);
        const nearbyIndices = [];
        for (let j = i + 1; j < numPts; j++) {
            if (strandPoints[i].distanceTo(strandPoints[j]) < webControls.maxDistance) {
                nearbyIndices.push(j);
            }
        }
        nearbyIndices.sort(() => Math.random() - 0.5);
        for (const j of nearbyIndices) {
            if (!connections.has(j)) connections.set(j, 0);
            if (currentConnections < webControls.maxConnections && connections.get(j) < webControls.maxConnections) {
                linePoints.push(strandPoints[i].x, strandPoints[i].y, strandPoints[i].z);
                linePoints.push(strandPoints[j].x, strandPoints[j].y, strandPoints[j].z);
                connections.set(i, connections.get(i) + 1);
                connections.set(j, connections.get(j) + 1);
                currentConnections++;
            }
            if (currentConnections >= webControls.maxConnections) break;
        }
    }

    // Create or update geometry
    const geometry = geometryRef.current || new THREE.BufferGeometry();
    const positions = new Float32Array(linePoints);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere(); // Needed for frustum culling

    geometryRef.current = geometry;
    originalPositions.current = positions.slice();
    lastBeatTime.current = -Infinity; // Reset beat tracking on geometry change
    beatCount.current = 0;
    lastIntensityPulseTime.current = -Infinity;
    lastColorPulseTime.current = -Infinity;

  }, [webControls.numPoints, webControls.volumeSize, webControls.maxDistance, webControls.maxConnections]);


  // RTA + Beat Animation frame loop
  useFrame(({ clock }) => {
      const material = materialRef.current;
      const geometry = geometryRef.current;
      if (!geometry || !material || !originalPositions.current || !geometry.attributes.position || bpm <= 0) return;

      const time = clock.getElapsedTime();
      const positions = geometry.attributes.position.array;
      const original = originalPositions.current;
      const numVertices = positions.length / 3;

      // Normalize frequency data (assuming input is 0-1 already, if not, divide by 255)
      const [lowF, midF, highF] = freqData; // Assuming freqData is [low, mid, high] normalized 0-1
      const avgF = (lowF + midF + highF) / 3;

      // --- Beat Detection --- 
      const quarterNoteDuration = 60 / bpm;
      const timeSinceLastBeat = time - lastBeatTime.current;
      let triggerBeat = false;
      if (timeSinceLastBeat >= quarterNoteDuration - 0.02) { 
           triggerBeat = true;
           lastBeatTime.current = time; 
           beatCount.current++;
      }

      // --- Check for Beat Pulse Triggers --- 
      if (triggerBeat) {
          if (beatCount.current % 2 === 0) { // Half note
              lastIntensityPulseTime.current = time;
          }
          if (beatCount.current % 4 === 0) { // Whole note
              lastColorPulseTime.current = time;
          }
      }

      // --- Calculate Beat Pulse States --- 
      const timeSinceIntensityPulse = time - lastIntensityPulseTime.current;
      const intensityPulseActive = timeSinceIntensityPulse >= 0 && timeSinceIntensityPulse < webControls.pulseDuration;
      const intensityDecay = intensityPulseActive ? 1.0 - Math.min(1.0, timeSinceIntensityPulse / webControls.pulseDuration) : 0;

      const timeSinceColorPulse = time - lastColorPulseTime.current;
      const colorPulseActive = timeSinceColorPulse >= 0 && timeSinceColorPulse < webControls.pulseDuration;

      // --- Update Material (Intensity & Color) --- 
      // Base intensity + freq reaction + beat pulse
      const freqIntensity = avgF * webControls.freqIntensityFactor;
      const beatIntensityBoost = (webControls.pulseIntensityMax - webControls.emissiveIntensity) * intensityDecay;
      const targetIntensity = webControls.emissiveIntensity + freqIntensity + beatIntensityBoost;
      material.emissiveIntensity += (targetIntensity - material.emissiveIntensity) * 0.2; // Lerp

      // Beat color pulse overrides base emissive color
      if (colorPulseActive) {
          if (!material.emissive.equals(new THREE.Color(webControls.pulseColor))) {
             material.emissive.set(webControls.pulseColor);
          }
      } else {
          if (!material.emissive.equals(new THREE.Color(webControls.emissiveColor))) {
             material.emissive.set(webControls.emissiveColor);
          }
      }

      // --- Update Geometry (Frequency Displacement) --- 
      let needsGeomUpdate = false;
      const mapRadius = webControls.maxRadiusForFreqMapping;
      for (let i = 0; i < numVertices; i++) {
          const index = i * 3;
          const ox = original[index];
          const oy = original[index + 1];
          const dist = Math.sqrt(ox * ox + oy * oy); // Distance from center in local XY plane
          const normalizedDist = Math.min(1.0, dist / mapRadius); // 0 at center, 1 at mapRadius

          let targetZ = 0;
          // Map frequency bands to Z displacement based on normalized distance
          if (normalizedDist < 0.33) { // Inner third -> Low Freq
              targetZ = lowF * webControls.lowFreqMultiplier;
          } else if (normalizedDist < 0.66) { // Middle third -> Mid Freq
              targetZ = midF * webControls.midFreqMultiplier;
          } else { // Outer third -> High Freq
              targetZ = highF * webControls.highFreqMultiplier;
          }
          
          // Apply a subtle continuous sine wave based on time? (Optional)
          // targetZ += Math.sin(dist * 1.0 + time * 1.5) * 0.02;

          // Smoothly interpolate Z position
          if (Math.abs(positions[index + 2] - targetZ) > 0.005) { // Increased threshold slightly
               positions[index + 2] += (targetZ - positions[index + 2]) * 0.1; // Slower lerp for frequency reaction
               needsGeomUpdate = true;
          } else if (targetZ === 0 && Math.abs(positions[index + 2]) > 0.005) {
              // Lerp back to 0 if target is 0 and current position isn't close
              positions[index + 2] *= 0.9;
              needsGeomUpdate = true;
          }
      }

      if (needsGeomUpdate) {
          geometry.attributes.position.needsUpdate = true;
      }
  });

  return (
    <group
      ref={groupRef}
      position={webControls.position}
      rotation={webControls.rotation}
      scale={[webControls.scale, webControls.scale, webControls.scale]}
    >
      {geometryRef.current && materialRef.current && (
          <lineSegments geometry={geometryRef.current} material={materialRef.current} />
      )}
    </group>
  );
};

export default SpiderWeb; 