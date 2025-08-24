import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleShaderMaterial } from './shaders/ParticleShader';

const StarParticles = ({ particleCount = 1000, rotation }) => {
    const particleMaterialRef = useRef();

    // --- Star Particle Generation ---
    const starPositions = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const distance = 5; // Base distance marker
        
        // Define the inner and outer bounds for the star field
        const innerRadiusFactor = 0.4;
        const outerRadiusFactor = 2.5;
        const innerRadius = distance * innerRadiusFactor;
        const outerRadius = distance * outerRadiusFactor;
        const radiusRange = outerRadius - innerRadius;

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2; // Random angle
            const biasedRandom = Math.pow(Math.random(), 2);
            const r = innerRadius + biasedRandom * radiusRange; 
            
            const x = r * Math.cos(theta);
            const y = (Math.random() - 0.5) * 1.0; // Keep vertical spread
            const z = r * Math.sin(theta);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    }, [particleCount]);

    // Update shader time uniform
    useFrame((state) => {
        if (particleMaterialRef.current) {
            particleMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <points rotation={rotation} frustumCulled={false}>
            <bufferGeometry attach="geometry">
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={starPositions}
                    itemSize={3}
                    needsUpdate={false} // Initial positions don't need update every frame now
                />
            </bufferGeometry>
            {/* Use the custom shader material */}
            <particleShaderMaterial 
                ref={particleMaterialRef}
                transparent={true} // Enable transparency for glow falloff
                depthWrite={false} // Important for correct blending
                blending={THREE.AdditiveBlending} // Make colors add up for brighter overlaps
            />
        </points>
    );
};

export default StarParticles; 