// AudioPlaneParticles.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls, Leva } from 'leva';
import { createNoise3D } from 'simplex-noise'; // Ensure this is installed: npm install simplex-noise

// --- Static Configs (Replaced Leva useControls for these sections) ---
const GENERAL_CONTROLS_CONFIG = {
    gridSize: 24,
    planeSize: 18.3,
    position: [3, 0, -2],
    rotation: { x: 95, y: 0, z: -5 },
};

const WAVE_CONTROLS_CONFIG = {
    active: true,
    intensity: 2.3,
    frequency: 1,
    speed: 1.5,
    falloff: 0,
    source: 'Highs',
    bassBins: [0, 5],
    midBins: [6, 25],
    highBins: [26, 63],
};

const NOISE_CONTROLS_CONFIG = {
    active: true,
    intensity: 0.18,
    scale: 2.4,
    speed: 0,
};

const APPEARANCE_CONTROLS_CONFIG = {
    particleSize: 0.01,
    colorByHeightActive: true,
    baseColor: '#036292',
    peakColor: '#ffdd33',
    emissiveByHeightActive: true,
    baseEmissiveIntensity: 1,
    peakEmissiveBoost: 15,
    materialEmissiveColor: '#00fffd',
    roughness: 0.4,
    metalness: 0.1,
};
// --- End Static Configs ---

// --- Helper Functions ---
const getFrequencyRangeAverage = (data, startBin, endBin) => {
    // Normalizes frequency data from a specific bin range to an approximate 0-1 scale.
    if (!data || data.length === 0) return 0;
    const len = data.length;
    // Ensure startBin and endBin are valid indices.
    const validStart = Math.max(0, Math.floor(startBin));
    const validEnd = Math.min(len - 1, Math.floor(endBin));

    if (validEnd < validStart) return 0; // Invalid range

    let sum = 0;
    const count = validEnd - validStart + 1;
    for (let i = validStart; i <= validEnd; i++) {
        sum += data[i]; // Sum raw frequency data (typically 0-255)
    }
    // Calculate average and normalize by dividing by 255 (max possible value for a frequency bin).
    return count > 0 ? (sum / count / 255) : 0;
};

// Initialize noise function with a random seed for variation on each load.
const noise3D = createNoise3D(Math.random);

// --- Component ---
const AudioPlaneParticles = ({
    audioAnalyser // Prop containing { update: () => {data, avg}, data: initialData, isPlaying: boolean }
}) => {
    
    // --- Leva Controls ---
    // const generalControls = useControls('Plane General Settings', {
    //     gridSize: { value: 24, min: 5, max: 150, step: 1, label: 'Grid Size (Particles/Side)' },
    //     planeSize: { value: 18.3, min: 1, max: 30, step: 0.1, label: 'Plane Size (Width/Depth)' },
    //     position: { value: [3, 0, -2], step: 0.1, label: "Position (X,Y,Z)"},
    //     rotation: { value: { x: 95, y: 0, z: -5 }, step: 1, label: 'Rotation (deg)' },
    // });
    const generalControls = GENERAL_CONTROLS_CONFIG;

    // Destructure for easier use
    const { gridSize, planeSize, rotation: planeRotationDeg, position: planePosition } = generalControls;

    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // const waveControls = useControls('Wave Settings', {
    //     active: { value: true, label: "Enable Waves" },
    //     intensity: { value: 2.3, min: 0, max: 5, step: 0.01, label: "Wave Intensity" },
    //     frequency: { value: 1, min: 0.1, max: 10, step: 0.1, label: "Wave Spatial Frequency" }, 
    //     speed: { value: 1.5, min: 0.1, max: 10, step: 0.1, label: "Wave Speed" },     
    //     falloff: { value: 0, min: 0, max: 3, step: 0.01, label: "Wave Falloff (Distance)" },      
    //     source: { options: ['Average', 'Bass', 'Mids', 'Highs'], value: 'Highs', label: "Audio Source for Waves" },
    //     bassBins: { value: [0, 5], min: 0, max: 63, step: 0.1, label: 'Bass Bins [Start, End]' },
    //     midBins: { value: [6, 25], min: 0, max: 63, step: 1, label: 'Mid Bins [Start, End]' },
    //     highBins: { value: [26, 63], min: 0, max: 63, step: 1, label: 'High Bins [Start, End]' },
    // });
    const waveControls = WAVE_CONTROLS_CONFIG;

    // const noiseControls = useControls('Noise Settings', {
    //     active: { value: true, label: "Enable Noise Displacement" },
    //     intensity: { value: 0.18, min: 0, max: 1, step: 0.005, label: "Noise Intensity" },
    //     scale: { value: 2.4, min: 0.1, max: 5, step: 0.1, label: "Noise Spatial Scale" },      
    //     speed: { value: 0, min: 0, max: 2, step: 0.05, label: "Noise Animation Speed" },       
    // });
    const noiseControls = NOISE_CONTROLS_CONFIG;

    // const appearanceControls = useControls('Appearance', {
    //     particleSize: { value: 0.01, min: 0.005, max: 0.1, step: 0.001 },
    //     colorByHeightActive: { value: true, label: 'Enable Color by Height' },
    //     baseColor: { value: '#036292', label: 'Base Color (Low Points)' }, 
    //     peakColor: { value: '#ffdd33', label: 'Peak Color (High Points)' }, 
    //     emissiveByHeightActive: { value: true, label: 'Enable Emissive by Height' },
    //     baseEmissiveIntensity: { value: 1, min: 0, max: 10, step: 0.1, label: 'Base Emissive Intensity' },
    //     peakEmissiveBoost: { value: 15, min: 1, max: 15, step: 0.1, label: 'Peak Emissive Boost Multiplier' },
    //     materialEmissiveColor: { value: '#00fffd', label: 'Material Emissive Base (for Vertex Interaction)'},
    //     roughness: { value: 0.4, min: 0, max: 1, step: 0.05 },
    //     metalness: { value: 0.1, min: 0, max: 1, step: 0.05 },
    // });
    const appearanceControls = APPEARANCE_CONTROLS_CONFIG;

    // --- Particle Grid Generation ---
    const particles = useMemo(() => {
        const temp = [];
        if (gridSize <= 1) return temp;
        const step = planeSize / (gridSize - 1);
        const halfSize = planeSize / 2;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = i * step - halfSize;
                const z = j * step - halfSize;
                const y = 0;
                const dist = Math.sqrt(x * x + z * z);
                temp.push({ initialX: x, initialY: y, initialZ: z, dist });
            }
        }
        return temp;
    }, [gridSize, planeSize]);

    // --- Per-Instance Color Attribute ---
    const colorAttribute = useMemo(() => {
        const currentParticleCount = gridSize * gridSize;
        const colors = new Float32Array(currentParticleCount * 3);
        const initialColor = new THREE.Color(appearanceControls.baseColor);
        for (let i = 0; i < currentParticleCount; ++i) {
            initialColor.toArray(colors, i * 3);
        }
        return new THREE.InstancedBufferAttribute(colors, 3);
    }, [gridSize, appearanceControls.baseColor]);

    // --- Material Ref and Updates ---
    const materialRef = useRef();
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = appearanceControls.baseEmissiveIntensity;
            materialRef.current.roughness = appearanceControls.roughness;
            materialRef.current.metalness = appearanceControls.metalness;
            materialRef.current.emissive.set(appearanceControls.materialEmissiveColor);
        }
        if (mesh.current) {
            mesh.current.geometry.setAttribute('color', colorAttribute);
            if(mesh.current.material) {
                 mesh.current.material.vertexColors = true; 
                 mesh.current.material.needsUpdate = true;
            }
        }
    }, [appearanceControls, colorAttribute]);

    // Apply plane position and rotation
    useEffect(() => {
        if (mesh.current) {
            mesh.current.position.set(planePosition[0], planePosition[1], planePosition[2]);
            mesh.current.rotation.set(
                THREE.MathUtils.degToRad(planeRotationDeg.x),
                THREE.MathUtils.degToRad(planeRotationDeg.y),
                THREE.MathUtils.degToRad(planeRotationDeg.z)
            );
        }
    }, [planePosition, planeRotationDeg]);

    // --- Reusable THREE.Color instances for performance ---
    const tempBaseColor = useMemo(() => new THREE.Color(), []);
    const tempPeakColor = useMemo(() => new THREE.Color(), []);
    const tempCurrentColor = useMemo(() => new THREE.Color(), []);
    const boostedPeakColorInstance = useMemo(() => new THREE.Color(), []); // For emissive boost

    // --- Frame Loop ---
    useFrame((state, delta) => {
        if (!mesh.current || !audioAnalyser || !audioAnalyser.update || particles.length === 0) return;

        const time = state.clock.getElapsedTime();
        
        // Correctly get audio data and isPlaying status
        const { data, avg } = audioAnalyser.update(); 
        const isPlaying = audioAnalyser.isPlaying; // Access isPlaying as a direct property

        const normalizedAvg = isPlaying && avg ? avg / 255 : 0; 
        let audioValue = 0;

        if (waveControls.active && isPlaying && data) {
            switch (waveControls.source) {
                case 'Bass':
                    audioValue = getFrequencyRangeAverage(data, waveControls.bassBins[0], waveControls.bassBins[1]);
                    break;
                case 'Mids':
                    audioValue = getFrequencyRangeAverage(data, waveControls.midBins[0], waveControls.midBins[1]);
                    break;
                case 'Highs':
                    audioValue = getFrequencyRangeAverage(data, waveControls.highBins[0], waveControls.highBins[1]);
                    break;
                case 'Average':
                default:
                    audioValue = normalizedAvg;
                    break;
            }
        }

        tempBaseColor.set(appearanceControls.baseColor);
        tempPeakColor.set(appearanceControls.peakColor);
        let needsColorUpdate = false;

        const maxWaveDisplacement = waveControls.intensity;
        const maxNoiseDisplacement = noiseControls.intensity;
        const estimatedMaxHeight = (waveControls.active ? maxWaveDisplacement : 0) + 
                                 (noiseControls.active ? maxNoiseDisplacement : 0);

        // Prepare boosted peak color once per frame if active
        let actualPeakColorForLerp = tempPeakColor;
        if (appearanceControls.colorByHeightActive && appearanceControls.emissiveByHeightActive) {
            boostedPeakColorInstance.copy(tempPeakColor).multiplyScalar(appearanceControls.peakEmissiveBoost);
            actualPeakColorForLerp = boostedPeakColorInstance;
        }


        particles.forEach((particle, i) => {
            const { initialX, initialY, initialZ, dist } = particle;
            let currentY = initialY;

            if (waveControls.active && audioValue > 0.001) {
                const waveEffect =
                    Math.sin(dist * waveControls.frequency - time * waveControls.speed) *
                    audioValue * waveControls.intensity /
                    (1 + dist * waveControls.falloff); 
                currentY += waveEffect;
            }

            if (noiseControls.active) {
                const noiseEffect = noise3D(
                    initialX * noiseControls.scale,
                    initialZ * noiseControls.scale,
                    time * noiseControls.speed
                ) * noiseControls.intensity;
                currentY += noiseEffect;
            }

            dummy.position.set(initialX, currentY, initialZ);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);

            if (appearanceControls.colorByHeightActive) {
                const normalizedCurrentY = Math.max(0, currentY - initialY);
                let heightFactor = 0;
                if (estimatedMaxHeight > 0.01) {
                     heightFactor = THREE.MathUtils.smoothstep(normalizedCurrentY / estimatedMaxHeight, 0, 1);
                }
                heightFactor = THREE.MathUtils.clamp(heightFactor, 0, 1);

                tempCurrentColor.copy(tempBaseColor).lerp(actualPeakColorForLerp, heightFactor);
                
                colorAttribute.setXYZ(i, tempCurrentColor.r, tempCurrentColor.g, tempCurrentColor.b);
                needsColorUpdate = true;
            } else {
                // If colorByHeight is not active, ensure particles are set to baseColor
                // Only update if the color is not already the base color to avoid unnecessary updates
                const r = colorAttribute.getX(i);
                const g = colorAttribute.getY(i);
                const b = colorAttribute.getZ(i);
                if (r !== tempBaseColor.r || g !== tempBaseColor.g || b !== tempBaseColor.b) {
                    colorAttribute.setXYZ(i, tempBaseColor.r, tempBaseColor.g, tempBaseColor.b);
                    needsColorUpdate = true;
                }
            }
        }); 

        mesh.current.instanceMatrix.needsUpdate = true;

        if (needsColorUpdate) {
            colorAttribute.needsUpdate = true;
        }
    }); 

    const meshKey = useMemo(() => `${gridSize}-${appearanceControls.particleSize}`, [gridSize, appearanceControls.particleSize]);

    return (
        <>
            <instancedMesh
                key={meshKey}
                ref={mesh}
                args={[null, null, gridSize * gridSize]}
                castShadow
                receiveShadow
            >
                <sphereGeometry args={[appearanceControls.particleSize, 8, 8]} />
                <meshStandardMaterial
                    ref={materialRef}
                    roughness={appearanceControls.roughness}
                    metalness={appearanceControls.metalness}
                    emissive={appearanceControls.materialEmissiveColor}
                    emissiveIntensity={appearanceControls.baseEmissiveIntensity}
                    toneMapped={false}
                    vertexColors={true}
                />
            </instancedMesh>
        </>
    );
};

export default AudioPlaneParticles;
