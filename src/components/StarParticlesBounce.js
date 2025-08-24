import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points } from '@react-three/drei';
import * as THREE from 'three';
// Import the new shader
import { BounceParticleShaderMaterial } from './shaders/BounceParticleShader';

// Trigger prop is now the timestamp of the last trigger event
const StarParticlesBounce = ({ particleCount = 1000, trigger }) => {
    const particleMaterialRef = useRef();
    // This ref is only needed to prevent updating the uniform unnecessarily every frame
    const lastUpdateTimeRef = useRef(-1.0);

    // --- Star Particle Generation (same as before) ---
    const starPositions = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const distance = 5;
        const innerRadiusFactor = 0.4;
        const outerRadiusFactor = 2.5;
        const innerRadius = distance * innerRadiusFactor;
        const outerRadius = distance * outerRadiusFactor;
        const radiusRange = outerRadius - innerRadius;

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const biasedRandom = Math.pow(Math.random(), 2);
            const r = innerRadius + biasedRandom * radiusRange; 
            const x = r * Math.cos(theta);
            const y = (Math.random() - 0.5) * 1.0;
            const z = r * Math.sin(theta);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    }, [particleCount]);

    // Effect to directly set the start time when the trigger timestamp changes
    useEffect(() => {
        // Update shader only if trigger is a valid time and different from the last update
        if (trigger >= 0 && trigger !== lastUpdateTimeRef.current && particleMaterialRef.current) {
            console.log("StarParticlesBounce updating start time to:", trigger);
            particleMaterialRef.current.uniforms.uBounceStartTime.value = trigger;
            lastUpdateTimeRef.current = trigger; // Store the last time we updated
        }
    }, [trigger]); // Rerun effect when trigger timestamp changes

    // Update only the general time uniform in useFrame
    useFrame((state) => {
        if (particleMaterialRef.current) {
            particleMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        // Remove the rotation prop - these particles don't rotate with the record
        <points frustumCulled={false}>
            <bufferGeometry attach="geometry">
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={starPositions}
                    itemSize={3}
                    needsUpdate={false} 
                />
            </bufferGeometry>
            {/* Use the new custom bounce shader material */}
            <bounceParticleShaderMaterial 
                ref={particleMaterialRef}
                transparent={true} 
                depthWrite={false} 
                blending={THREE.AdditiveBlending} 
            />
        </points>
    );
};

export default StarParticlesBounce; 