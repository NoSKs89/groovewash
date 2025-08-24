import React, { Suspense } from 'react';
import { Text3D } from '@react-three/drei';
import * as THREE from 'three';

// IMPORTANT: Make sure this font file exists in your public/fonts/ directory
const fontUrl = '/fonts/helvetiker_regular.typeface.json';

// Wrap the component function definition with React.memo
const NeonSign = React.memo(function NeonSign({
    visible = true, // Note: visibility handled by parent animation
    // position, rotation, scale are now applied to the animated.group wrapper
    color = 'cyan',
    glowIntensity = 2,
    ...props // Pass remaining props like onClick etc. if needed
}) {
    // Revert to MeshBasicMaterial for simpler, vibrant glow
    const neonMaterial = new THREE.MeshBasicMaterial({
        color: color,
        emissive: color, // Set emissive color
        emissiveIntensity: glowIntensity, // Use glowIntensity prop here
        toneMapped: false, // Crucial for emissive materials with Bloom
        // No roughness or metalness for basic material
    });

    // Visibility check might be redundant if parent animation handles scale/opacity
    // if (!visible) {
    //     return null; 
    // }

    // The group wrapper is removed here as position/rotation/scale are handled by the animated group in the parent
    return (
        // Use Suspense directly
        <Suspense fallback={null}>
            {/* "NOW" Text */}
            <Text3D
                font={fontUrl}
                size={0.5}
                height={0.05}
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.01}
                bevelSize={0.01}
                bevelOffset={0}
                bevelSegments={5}
                position={[0, 0.3, 0]} // Keep relative position within the animated group
                {...props} // Spread other props if needed
            >
                NOW
                <primitive object={neonMaterial} attach="material" />
            </Text3D>

            {/* "PLAYING" Text */}
            <Text3D
                font={fontUrl}
                size={0.4} // Slightly smaller
                height={0.05}
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.01}
                bevelSize={0.01}
                bevelOffset={0}
                bevelSegments={5}
                position={[-0.85, -0.3, 0]} // Keep relative position within the animated group
                {...props} // Spread other props if needed
            >
                PLAYING
                <primitive object={neonMaterial} attach="material" />
            </Text3D>
        </Suspense>
    );
});

export default NeonSign; 