import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

// Re-introduce AnimatedMeshStandardMaterial correctly
const AnimatedMeshStandardMaterial = animated('meshStandardMaterial');

// Accept isClean prop
const InstancedParticles = ({ count = 150, isClean }) => {
    const mesh = useRef();
    const { clock } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const isDirty = !isClean;
    const [applyDirtyColors, setApplyDirtyColors] = useState(false);
    const colorChangeTimeoutRef = useRef(null);
    
    // Spring for radius multiplier
    const { radiusMultiplier } = useSpring({
        to: { radiusMultiplier: isDirty ? 0.5 : 1 },
        config: { tension: 170, friction: 26 } // Standard spring config, adjust as needed
    });

    const bloodRedColorString = "#880808"; // Define as string for spring
    const defaultColorString = "#ffffff";
    const defaultEmissiveString = "#88aaff";

    // Springs for color and emissive properties
    const materialSpringProps = useSpring({
        to: {
            // Spring will interpolate these strings to colors for .get() if used with .set()
            color: applyDirtyColors ? bloodRedColorString : defaultColorString,
            emissive: applyDirtyColors ? bloodRedColorString : defaultEmissiveString,
            emissiveIntensity: applyDirtyColors ? 1.5 : 2.0
        },
        config: { tension: 170, friction: 26 } // Same config, or adjust for color speed
    });

    const particles = useMemo(() => {
        const temp = [];
        const baseRadiusSetting = 3.85; // Store the clean state base radius
        const radiusVarianceSetting = 2.2; // Store the clean state radius variance
        const heightVariance = 0.1; 
        const baseHeightOffset = 0; 

        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 1 + Math.random() * 20; 
            const speed = 0.005 + Math.random() / 250; 
            
            const angle = Math.random() * Math.PI * 2;
            // Store the particle's individual base radius (before dynamic multiplier)
            const individualBaseRadius = baseRadiusSetting + (Math.random() - 0.5) * radiusVarianceSetting;
            const initialY = baseHeightOffset + (Math.random() - 0.5) * heightVariance;

            // We don't store initialX/Z directly anymore, as they depend on the animated multiplier
            temp.push({ t, factor, speed, angle, individualBaseRadius, initialY });
        }
        return temp;
    }, [count]); // Only depends on count now

    // Effect to manage delayed color change to dirty
    useEffect(() => {
        // Clear any existing timeout when isClean/isDirty changes
        if (colorChangeTimeoutRef.current) {
            clearTimeout(colorChangeTimeoutRef.current);
            colorChangeTimeoutRef.current = null;
        }

        if (isDirty) {
            // Set a timeout to apply dirty colors
            colorChangeTimeoutRef.current = setTimeout(() => {
                setApplyDirtyColors(true);
            }, 1000); // 1-second delay
        } else {
            // If not dirty (isClean is true), immediately revert to default colors
            setApplyDirtyColors(false);
        }

        // Cleanup timeout on unmount or if isDirty changes again before timeout fires
        return () => {
            if (colorChangeTimeoutRef.current) {
                clearTimeout(colorChangeTimeoutRef.current);
            }
        };
    }, [isDirty]);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = clock.getElapsedTime();
        const currentRadiusMultiplier = radiusMultiplier.get(); // Get current value from spring

        particles.forEach((particle, i) => {
            let { t, factor, speed, angle, individualBaseRadius, initialY } = particle;
            
            t = particle.t += speed / 2;
            const s = Math.cos(t);
            
            // Calculate current effective radius for this particle
            const effectiveRadius = individualBaseRadius * currentRadiusMultiplier;

            // Calculate base X and Z from the effective radius and angle
            const baseX = Math.cos(angle) * effectiveRadius;
            const baseZ = Math.sin(angle) * effectiveRadius;

            // Calculate dynamic offsets (these remain small and local to the particle's base position)
            const xOffset = (Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10) * 0.1;
            const yOffset = (Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10) * -0.1;
            const zOffset = (Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10) * 0.1;
            
            dummy.position.set(
                baseX + xOffset,
                initialY + yOffset, // Y position is not affected by radius multiplier
                baseZ + zOffset
            );

            dummy.scale.set(s, s, s); 
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <animated.instancedMesh ref={mesh} args={[null, null, count]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <AnimatedMeshStandardMaterial 
                color={materialSpringProps.color} 
                emissive={materialSpringProps.emissive} 
                emissiveIntensity={materialSpringProps.emissiveIntensity} 
                roughness={0.2} 
                metalness={0.8}
                toneMapped={false}
            />
        </animated.instancedMesh>
    );
};

export default InstancedParticles; 