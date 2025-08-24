import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Component for a single expanding/fading pulse ring with a wobbly shape
function PulseRing({
    id,
    creationTime,
    maxRadius = 1,
    duration = 2,
    color = 'white',
    // Wobble parameters
    wobbleAmplitude = 0.06, // How much the radius deviates (relative to base radius 1)
    wobbleFrequencySpatial = 8, // How many waves around the circumference
    wobbleFrequencyTemporal = 3, // How fast the waves move around/animate
    baseY = -0.1,
    ringThickness = 0.005, // Relative thickness needs to be passed or defined here now
    thetaSegments = 64,   // Segments needed for geometry creation
    onComplete
}) {
    const meshRef = useRef();
    const matRef = useRef();
    const geomRef = useRef(); // Ref to hold the geometry
    const { clock } = useThree();

    // Store original vertex data (position and angle) only once
    const originalVertexData = useMemo(() => {
        // Create a temporary geometry to extract data from
        // Use the same parameters as the geometry in the return statement
        const tempGeom = new THREE.RingGeometry(1 - ringThickness, 1, thetaSegments);
        const posAttr = tempGeom.attributes.position;
        const data = [];
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            // z is 0 for RingGeometry on XY plane
            const angle = Math.atan2(y, x);
            // Store original position for reference
            data.push({ x, y, z: 0, angle });
        }
        tempGeom.dispose(); // Clean up temporary geometry
        return data;
    }, [ringThickness, thetaSegments]); // Recompute only if thickness/segments change

    useFrame(() => {
        if (!meshRef.current || !matRef.current || !geomRef.current) return;

        const elapsedTime = clock.getElapsedTime(); // Use raw elapsed time for continuous animation
        const creationElapsed = elapsedTime - creationTime;
        const progress = Math.min(creationElapsed / duration, 1);

        if (progress >= 1) {
            onComplete(id);
            return;
        }

        // --- Expansion and Fade (applied to the whole mesh) ---
        const currentRadius = progress * maxRadius;
        const currentOpacity = 1.0 - progress;

        meshRef.current.scale.set(currentRadius, currentRadius, 1);
        matRef.current.opacity = currentOpacity;
        matRef.current.needsUpdate = true;

        // --- Wobble Geometry Modification ---
        const positionAttribute = geomRef.current.attributes.position;
        const time = elapsedTime; // Use global time for wave animation continuity

        for (let i = 0; i < positionAttribute.count; i++) {
            const data = originalVertexData[i];
            const { x: ox, y: oy, z: oz, angle } = data;

            // Calculate the wobble offset for this vertex
            // The offset is radial (pushes vertex away from or towards the center)
            const wobbleOffset = wobbleAmplitude * Math.sin(
                angle * wobbleFrequencySpatial + time * wobbleFrequencyTemporal
            );

            // Calculate the direction vector (normalized original position)
            const originalRadius = Math.sqrt(ox * ox + oy * oy);
            // Avoid division by zero for center vertices if any (shouldn't happen in RingGeometry)
            const normX = originalRadius === 0 ? 0 : ox / originalRadius;
            const normY = originalRadius === 0 ? 0 : oy / originalRadius;

            // Calculate the new position by adding the offset along the radial direction
            // Note: We modify the *base* geometry vertices (radius around 1).
            // The mesh scaling then expands this wobbly shape.
            const nx = ox + normX * wobbleOffset;
            const ny = oy + normY * wobbleOffset;
            // z remains the original z (which is 0 for the base RingGeometry)

            positionAttribute.setXYZ(i, nx, ny, oz);
        }

        // Tell Three.js that the vertices have been updated
        positionAttribute.needsUpdate = true;
        // Optional: Recalculate normals if lighting is affected (not needed for MeshBasicMaterial)
        // geomRef.current.computeVertexNormals();

    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, baseY, 0]}>
            {/* Assign the geometry ref here */}
            <ringGeometry ref={geomRef} args={[1 - ringThickness, 1, thetaSegments]} />
            <meshStandardMaterial
                ref={matRef}
                color={color}
                side={THREE.DoubleSide}
                transparent
                opacity={1} // Initial opacity set here, controlled by useFrame
                depthTest={false}
                emissive={color} // Add emissive property with same color
                emissiveIntensity={0.8} // Control glow intensity
                toneMapped={false} // Makes colors brighter for bloom
            />
        </mesh>
    );
}

export default PulseRing; // Renamed component for clarity