import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls, Leva } from 'leva';
import { useSpring, animated } from '@react-spring/three';

// --- Static Configs (Replaced Leva useControls for these sections) ---
const GENERAL_SETTINGS_CONFIG = {
    groupRotation: { x: 90, y: 1.5, z: 0 },
    enableDefaultRotation: true,
    playingRotationSpeedFactor: 1.0,
};

const SCALE_BY_AVG_CONFIG = {
    active: true,
    intensity: 0.37,
    minScale: 0.01,
    peakMultiplier: 6.3,
    decaySpeed: 0.01,
    quietThreshold: 0.34,
    mediumThreshold: 0.44,
    loudThreshold: 0.77,
    debug: false,
};

const POS_Y_BY_AVG_CONFIG = {
    active: false,
    intensity: 0.02,
    decaySpeed: 0.95,
    minYOffset: -1.0,
    maxYOffset: 1.0,
};

const SPREAD_BY_AVG_CONFIG = {
    active: true,
    intensity: 0.05,
    minRadius: 0.7,
    maxRadius: 1.8,
    decaySpeed: 0.01,
    quietThreshold: 0.34,
    mediumThreshold: 0.54,
    loudThreshold: 0.77,
    peakMultiplier: 4,
};
// --- End Static Configs ---

// Helper to get average of a frequency range from our frequency data array
const getFrequencyRangeAverage = (data, startIndex, endIndex) => {
    if (!data || data.length === 0) return 0;
    const validStart = Math.max(0, startIndex);
    const validEnd = Math.min(data.length - 1, endIndex);
    
    if (validEnd < validStart) return 0;
    
    let sum = 0;
    for (let i = validStart; i <= validEnd; i++) {
        sum += data[i];
    }
    return sum / (validEnd - validStart + 1);
};

// Accept analyserRef, frequencyData, isClean, and isPlaying props
const InstancedParticles = ({ count = 750, analyserRef, frequencyData, isClean, isPlaying }) => {
    const mesh = useRef();
    const { clock } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // --- State and Refs for Clean/Dirty transitions ---
    const isDirty = !isClean;
    const [applyDirtyColors, setApplyDirtyColors] = useState(false);
    const colorChangeTimeoutRef = useRef(null);

    const bloodRedColorString = "#880808";
    const defaultColorString = "#ffffff"; // Initial base color for particles
    const defaultEmissiveString = "#88aaff"; // Initial emissive color

    // Spring for radius multiplier
    const { radiusMultiplier } = useSpring({
        to: { radiusMultiplier: isDirty ? 0.5 : 1 },
        config: { tension: 170, friction: 26 }
    });

    // --- Refs for smoothed audio values ---
    const smoothedPeakValueRef = useRef(0);
    const smoothedLoudnessRef = useRef(0);
    const SMOOTHING_FACTOR = 5; // Adjust for faster/slower smoothing

    // --- Ref for smoothed Y position offset ---
    const currentYOffsetRef = useRef(0); // NEW

    // Springs for material color and emissive properties
    const materialSpringProps = useSpring({
        to: {
            color: applyDirtyColors ? bloodRedColorString : defaultColorString,
            emissive: applyDirtyColors ? bloodRedColorString : defaultEmissiveString,
            // When dirty, intensity is fixed. When clean, it's initially the default,
            // but Leva controls for emissive might override it in useFrame.
            emissiveIntensity: applyDirtyColors ? 1.5 : 2.0 
        },
        config: { tension: 170, friction: 26 }
    });
    // --- End Clean/Dirty state ---

    // --- Rotation Constants ---
    const RECORD_RPM = 33.333;
    // Base speed calculation (before applying Leva factor)
    const BASE_PARTICLE_Y_ROTATION_SPEED_RAD_PER_SEC = (RECORD_RPM / 4 / 60) * Math.PI * 2;

    // --- Log frequencyData prop changes ---
    useEffect(() => {
        // Log only if debug is enabled and data looks different (simple check)
        if (scaleByAvgControls.debug && frequencyData && frequencyData.length > 0) {
             console.log('[InstancedParticles Prop Check] frequencyData updated, first few values:', frequencyData.slice(0, 5));
        }
    }, [frequencyData]); // Dependency array ensures this runs when frequencyData changes

    // --- General Settings ---
    // const generalSettings = useControls('0. General Settings', {
    //     groupRotation: {
    //         value: { x: 90, y: 1.5, z: 0 }, // UPDATED DEFAULT Y
    //         step: 1, // Degrees
    //         label: 'Group Rotation (deg)'
    //     },
    //     enableDefaultRotation: { value: true, label: 'Rotate Group When Playing' },
    //     playingRotationSpeedFactor: { value: 1.0, min: 0, max: 4, step: 0.1, label: 'Playing Rot Speed Factor' }
    // }, { collapsed: true });
    const generalSettings = GENERAL_SETTINGS_CONFIG;

    // --- Leva Controls: Use separate useControls calls like in RecordAnimation ---
    // 1. Scale by Loudness
    // const scaleByAvgControls = useControls('1. Scale by Loudness', {
    //     active: { value: true },
    //     intensity: { value: 0.37, min: 0, max: 2, step: 0.01 },
    //     minScale: { value: 0.01, min: 0, max: 2, step: 0.01 },
    //     peakMultiplier: { value: 6.3, min: 0.1, max: 20, step: 0.1 },
    //     decaySpeed: { value: 0.01, min: 0, max: 0.99, step: 0.001 },
    //     quietThreshold: { value: 0.34, min: 0, max: 1, step: 0.01, label: 'Quiet Thresh' },
    //     mediumThreshold: { value: 0.44, min: 0, max: 1, step: 0.01, label: 'Medium Thresh' },
    //     loudThreshold: { value: 0.77, min: 0, max: 1, step: 0.01, label: 'Loud Thresh' },
    //     debug: { value: false }
    // }, { collapsed: true });
    const scaleByAvgControls = SCALE_BY_AVG_CONFIG;

    // 2. Y Position by Loudness
    // const posYByAvgControls = useControls('2. Y Position by Loudness', {
    //     active: { value: false },
    //     intensity: { value: 0.02, min: 0, max: 0.3, step: 0.001 }, // User found 0.05 too high, starting lower
    //     decaySpeed: { value: 0.95, min: 0.01, max: 0.99, step: 0.001, label: 'Decay Speed' }, // NEW
    //     minYOffset: { value: -1.0, min: -5, max: 0, step: 0.01, label: 'Min Y Offset' },   // NEW
    //     maxYOffset: { value: 1.0, min: 0, max: 5, step: 0.01, label: 'Max Y Offset' }     // NEW
    // });
    const posYByAvgControls = POS_Y_BY_AVG_CONFIG;

    // 7. Radial Spread by Loudness
    // const spreadByAvgControls = useControls('7. Radial Spread by Loudness', {
    //     active: { value: true },
    //     intensity: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
    //     minRadius: { value: 0.7, min: 0, max: 5, step: 0.1 },
    //     maxRadius: { value: 1.8, min: 0.1, max: 10, step: 0.1 },
    //     decaySpeed: { value: 0.01, min: 0.01, max: 0.99, step: 0.001, label: 'Decay Speed' },
    //     quietThreshold: { value: 0.34, min: 0, max: 1, step: 0.01, label: 'Quiet Thresh' },
    //     mediumThreshold: { value: 0.54, min: 0, max: 1, step: 0.01, label: 'Medium Thresh' },
    //     loudThreshold: { value: 0.77, min: 0, max: 1, step: 0.01, label: 'Loud Thresh' },
    //     peakMultiplier: { value: 4, min: 0.1, max: 10, step: 0.1 }
    // });
    const spreadByAvgControls = SPREAD_BY_AVG_CONFIG;

    // Store the initial material properties
    const initialMaterialProps = useRef({
        color: new THREE.Color(defaultColorString),
        emissive: new THREE.Color(defaultEmissiveString),
        emissiveIntensity: 2.0,
        opacity: 1.0
    });

    // Effect to manage delayed color change to dirty (from InstancedParticlesOriginal)
    useEffect(() => {
        if (colorChangeTimeoutRef.current) {
            clearTimeout(colorChangeTimeoutRef.current);
            colorChangeTimeoutRef.current = null;
        }
        if (isDirty) {
            colorChangeTimeoutRef.current = setTimeout(() => {
                setApplyDirtyColors(true);
            }, 1000); // 1-second delay
        } else {
            setApplyDirtyColors(false);
        }
        return () => {
            if (colorChangeTimeoutRef.current) {
                clearTimeout(colorChangeTimeoutRef.current);
            }
        };
    }, [isDirty]);

    // Generate random positions for particles in a ring pattern
    const particles = useMemo(() => {
        const temp = [];
        const baseRadius = 3.85; // Increased base radius
        const radiusVariance = 2.2; // Increased variance for more spread
        const heightVariance = 0.1; // Keep Y variance small
        const baseHeightOffset = 0; // Base Y position

        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 1 + Math.random() * 20; // Random factor for trig functions
            const speed = 0.005 + Math.random() / 250; // Base animation speed
            
            // Generate position in a ring
            const angle = Math.random() * Math.PI * 2;
            const radius = baseRadius + (Math.random() - 0.5) * radiusVariance;
            const initialX = Math.cos(angle) * radius;
            const initialZ = Math.sin(angle) * radius;
            const initialY = baseHeightOffset + (Math.random() - 0.5) * heightVariance;

            temp.push({ 
                t, 
                factor, 
                speed, 
                initialX, 
                initialY, 
                initialZ,
                baseSpeed: speed,
                randomPhase: Math.random() * Math.PI * 2,
                // Store the angle and radius for radial effects
                angle,
                radius,
                // For frequency bin mapping
                freqIndex: Math.floor(Math.random() * 30) // Random index 0-29 for frequency mapping
            });
        }
        return temp;
    }, [count]);

    // Create per-instance color attribute
    const colorAttribute = useMemo(() => {
        const colors = new Float32Array(count * 3);
        const color = new THREE.Color(initialMaterialProps.current.color);
        for (let i = 0; i < count; i++) {
            color.toArray(colors, i * 3);
        }
        return new THREE.InstancedBufferAttribute(colors, 3);
    }, [count]);

    // Attach color attribute to the geometry
    useEffect(() => {
        if (mesh.current) {
            mesh.current.geometry.setAttribute('color', colorAttribute);
            mesh.current.material.vertexColors = true;
            mesh.current.material.needsUpdate = true;
            
            // Handle transparency if needed
            if (scaleByAvgControls.active && !mesh.current.material.transparent) {
                mesh.current.material.transparent = true;
                mesh.current.material.needsUpdate = true;
            }
        }
    }, [colorAttribute, scaleByAvgControls.active]);
    
    // State to hold the current scale for smooth decay
    const currentScaleMultiplier = useRef(scaleByAvgControls.minScale); // Initialize with minScale

    // Store ref for the current radial factor multiplier
    const currentRadialFactorRef = useRef(0);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        
        const time = clock.getElapsedTime();
        const material = mesh.current.material; // Get material reference

        // Initialize needsColorUpdate at the beginning of useFrame
        let needsColorUpdate = false;
        const tempColor = new THREE.Color();

        // Get current animated values from springs
        const currentRadiusMultiplier = radiusMultiplier.get();
        const { color: animColor, emissive: animEmissive, emissiveIntensity: animEmissiveIntensity } = materialSpringProps;
        
        // --- Get and Process Audio Data ---
        const currentFrequencyData = frequencyData || [];
        
        let peakValue = 0;
        let normalizedOverallLoudness = 0;

        if (isPlaying && currentFrequencyData.length > 0) {
            // Calculate peakValue from currentFrequencyData
            let maxFreqValue = 0;
            for (let i = 0; i < currentFrequencyData.length; i++) {
                if (currentFrequencyData[i] > maxFreqValue) {
                    maxFreqValue = currentFrequencyData[i];
                }
            }
            peakValue = maxFreqValue / 255.0; // Normalize to 0-1

            // Calculate normalizedOverallLoudness from currentFrequencyData
            const sum = currentFrequencyData.reduce((acc, val) => acc + (val || 0), 0);
            const overallFrequencyAverage = sum / currentFrequencyData.length;
            normalizedOverallLoudness = Math.min(1, overallFrequencyAverage / 255.0);
        }
        // --- If isPlaying is false, the values remain 0 ---

        // --- Smooth the key audio values ---
        const targetPeakValue = peakValue; // Use the calculated peak (or 0 if not playing)
        const targetNormalizedLoudness = normalizedOverallLoudness; // Use calculated loudness (or 0)

        smoothedPeakValueRef.current = THREE.MathUtils.lerp(
            smoothedPeakValueRef.current,
            targetPeakValue,
            delta * SMOOTHING_FACTOR
        );
        smoothedLoudnessRef.current = THREE.MathUtils.lerp(
            smoothedLoudnessRef.current,
            targetNormalizedLoudness,
            delta * SMOOTHING_FACTOR
        );

        // Use the smoothed values for effects
        const currentSmoothedPeak = smoothedPeakValueRef.current;
        const currentSmoothedLoudness = smoothedLoudnessRef.current;

        // --- More explicit debug logging inside useFrame ---
        if (scaleByAvgControls.debug && time % 1 < 0.02) { // Log less frequently
             // Log all thresholds
             console.log(`[useFrame Debug] Time: ${time.toFixed(1)} Peak(Smoothed): ${currentSmoothedPeak.toFixed(3)}, Thresh(Q/M/L): ${scaleByAvgControls.quietThreshold.toFixed(3)}/${scaleByAvgControls.mediumThreshold.toFixed(3)}/${scaleByAvgControls.loudThreshold.toFixed(3)}, CurrentScaleMult: ${currentScaleMultiplier.current.toFixed(3)}`);
             if(currentSmoothedPeak <= scaleByAvgControls.quietThreshold) { // Check against quiet threshold
                 console.log('    -> Peak is below quiet threshold.');
             }
        }
        
        // Apply Clean/Dirty Overrides
        if (applyDirtyColors) {
            material.color.set(animColor.get());
            material.emissive.set(animEmissive.get());
            material.emissiveIntensity = animEmissiveIntensity.get();
            if (material.vertexColors) {
                material.vertexColors = false;
                // We'll need to update the colorAttribute to this uniform dirty color
                // so that when vertexColors is turned back on, it doesn't show old colors.
                const dirtyColorTHREE = new THREE.Color(animColor.get());
                for (let i = 0; i < count; i++) {
                    colorAttribute.setXYZ(i, dirtyColorTHREE.r, dirtyColorTHREE.g, dirtyColorTHREE.b);
                }
                colorAttribute.needsUpdate = true; // Mark for update
            }
        } else {
            // Apply default clean material properties
            material.color.set(animColor.get());
            material.emissive.set(animEmissive.get());
            material.emissiveIntensity = animEmissiveIntensity.get();
            material.vertexColors = false;
        }
        material.needsUpdate = true;
        // --- End Material Updates ---
        
        // Process each particle
        particles.forEach((particle, i) => {
            let { 
                t, factor, speed, initialX, initialY, initialZ, 
                baseSpeed, randomPhase, angle, radius
            } = particle;
            
            // Update time value with baseSpeed
            t = particle.t += baseSpeed / 2;
            
            // Initialize position and scale variables
            let currentX, currentY, currentZ, scaleVal;
            
            // Base movement calculations
            const xOffset = (Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10) * 0.1;
            const yOffset = (Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10) * -0.1;
            const zOffset = (Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10) * 0.1;
            
            // Initialize scale variable for this particle/frame
            scaleVal = scaleByAvgControls.minScale;
            
            // Apply radiusMultiplier to the base positions BEFORE other offsets
            const effectiveInitialX = initialX * currentRadiusMultiplier;
            const effectiveInitialY = initialY; // Y not typically scaled by overall radius
            const effectiveInitialZ = initialZ * currentRadiusMultiplier;

            currentX = effectiveInitialX + xOffset;
            currentY = effectiveInitialY + yOffset;
            currentZ = effectiveInitialZ + zOffset;
            
            // 1. Scale by overall loudness using peak detection and decay
            if (scaleByAvgControls.active) {

                // --- Always apply decay towards minScale --- 
                currentScaleMultiplier.current = currentScaleMultiplier.current * scaleByAvgControls.decaySpeed +
                                                scaleByAvgControls.minScale * (1 - scaleByAvgControls.decaySpeed);

                // --- Multi-Stage Impulse Logic --- 
                let impulseAmount = 0;
                let level = 'none';

                if (currentSmoothedPeak > scaleByAvgControls.loudThreshold) { // Use smoothed peak
                    level = 'Loud';
                    // Apply full intensity/multiplier for loud sounds, scaled up
                    impulseAmount = (currentSmoothedPeak - scaleByAvgControls.loudThreshold) * // Use smoothed peak
                                      scaleByAvgControls.intensity * 
                                      (scaleByAvgControls.peakMultiplier * 4.5); // Increased multiplier
                } else if (currentSmoothedPeak > scaleByAvgControls.mediumThreshold) { // Use smoothed peak
                    level = 'Medium';
                    // Apply slightly reduced intensity/multiplier for medium sounds, scaled up
                    impulseAmount = (currentSmoothedPeak - scaleByAvgControls.mediumThreshold) * // Use smoothed peak
                                      scaleByAvgControls.intensity * 
                                      (scaleByAvgControls.peakMultiplier * 2.25); // Increased multiplier
                } else if (currentSmoothedPeak > scaleByAvgControls.quietThreshold) { // Use smoothed peak
                    level = 'Quiet';
                     // Apply significantly reduced intensity/multiplier for quiet sounds, base multiplier
                    impulseAmount = (currentSmoothedPeak - scaleByAvgControls.quietThreshold) * // Use smoothed peak
                                      scaleByAvgControls.intensity * 
                                      scaleByAvgControls.peakMultiplier; // Base multiplier
                }
                
                // Add the calculated impulse if any
                if (impulseAmount > 0) {
                    currentScaleMultiplier.current += impulseAmount; // Additive impulse

                    // Log when impulse happens
                    if (scaleByAvgControls.debug && time % 1 < 0.02) {
                         console.log(`    -> IMPULSE ADDED (${level})! peak=${currentSmoothedPeak.toFixed(3)}, impulse=${impulseAmount.toFixed(3)}, newMult=${currentScaleMultiplier.current.toFixed(3)}`);
                    }
                } else {
                    // Log decay only when no impulse is added
                    if (scaleByAvgControls.debug && time % 1 < 0.02) { 
                        console.log(`    -> Decaying... newMult=${currentScaleMultiplier.current.toFixed(3)}`);
                     }
                }

                // Clamp minimum scale (safety check)
                currentScaleMultiplier.current = Math.max(scaleByAvgControls.minScale, currentScaleMultiplier.current);

                // Apply the final multiplier
                scaleVal = currentScaleMultiplier.current * (1 + (Math.random() - 0.5) * 0.1);

            } else {
                // If not active, reset scale multiplier and use minScale
                currentScaleMultiplier.current = scaleByAvgControls.minScale;
                scaleVal = scaleByAvgControls.minScale * (1 + (Math.random() - 0.5) * 0.1);
            }
            
            // 2. Y Position by loudness - Use normalizedOverallLoudness
            if (posYByAvgControls.active) {
                // Calculate the target impulse based on loudness and intensity
                const targetYImpulse = currentSmoothedLoudness * posYByAvgControls.intensity;
                
                // Add impulse to the current offset
                currentYOffsetRef.current += targetYImpulse;
                
                // Apply decay
                currentYOffsetRef.current *= posYByAvgControls.decaySpeed;
                
                // Clamp the offset
                currentYOffsetRef.current = THREE.MathUtils.clamp(
                    currentYOffsetRef.current,
                    posYByAvgControls.minYOffset,
                    posYByAvgControls.maxYOffset
                );
                
                currentY += currentYOffsetRef.current; // Apply the smoothed and decayed offset
            } else {
                // If not active, decay the current offset towards 0
                currentYOffsetRef.current *= posYByAvgControls.decaySpeed;
                 if (Math.abs(currentYOffsetRef.current) < 0.001) {
                    currentYOffsetRef.current = 0; // Snap to zero if very small
                }
                currentY += currentYOffsetRef.current; // Apply decaying offset even if not active
            }
            
            // 7. Radial spread by loudness - Use peak detection like Scale by Loudness
            if (spreadByAvgControls.active) {
                // --- Always apply decay towards minRadius ---
                // If this is the first particle in the loop, update the global radial factor
                if (i === 0) {
                    // Apply decay to the global factor
                    currentRadialFactorRef.current = currentRadialFactorRef.current * spreadByAvgControls.decaySpeed;
                    
                    // --- Multi-Stage Impulse Logic --- 
                    let impulseAmount = 0;
                    
                    if (currentSmoothedPeak > spreadByAvgControls.loudThreshold) {
                        // Apply full intensity for loud sounds
                        impulseAmount = (currentSmoothedPeak - spreadByAvgControls.loudThreshold) * 
                                        spreadByAvgControls.intensity * 
                                        (spreadByAvgControls.peakMultiplier * 3);
                    } else if (currentSmoothedPeak > spreadByAvgControls.mediumThreshold) {
                        // Apply medium intensity for medium sounds
                        impulseAmount = (currentSmoothedPeak - spreadByAvgControls.mediumThreshold) * 
                                        spreadByAvgControls.intensity * 
                                        (spreadByAvgControls.peakMultiplier * 1.5);
                    } else if (currentSmoothedPeak > spreadByAvgControls.quietThreshold) {
                        // Apply low intensity for quiet sounds
                        impulseAmount = (currentSmoothedPeak - spreadByAvgControls.quietThreshold) * 
                                        spreadByAvgControls.intensity * 
                                        spreadByAvgControls.peakMultiplier;
                    }
                    
                    // Add the calculated impulse if any
                    if (impulseAmount > 0) {
                        currentRadialFactorRef.current += impulseAmount;
                        
                        // Log when impulse happens if debug is enabled
                        if (scaleByAvgControls.debug && time % 1 < 0.02) {
                            console.log(`    -> RADIAL IMPULSE! peak=${currentSmoothedPeak.toFixed(3)}, impulse=${impulseAmount.toFixed(3)}, newFactor=${currentRadialFactorRef.current.toFixed(3)}`);
                        }
                    }
                    
                    // Clamp between 0 and maxRadius-minRadius (since we add minRadius later)
                    const maxFactor = spreadByAvgControls.maxRadius - spreadByAvgControls.minRadius;
                    currentRadialFactorRef.current = Math.max(0, Math.min(currentRadialFactorRef.current, maxFactor));
                }
                
                // Current base radius with global radius multiplier applied
                const currentBaseRadius = particle.radius * currentRadiusMultiplier;
                
                // Calculate final radius: minRadius + (peak-based factor)
                const finalRadius = spreadByAvgControls.minRadius + currentRadialFactorRef.current;
                
                // Apply the spread factor to position
                currentX = Math.cos(angle) * (currentBaseRadius * finalRadius) + xOffset;
                currentZ = Math.sin(angle) * (currentBaseRadius * finalRadius) + zOffset;
            } else if (i === 0 && currentRadialFactorRef.current > 0) {
                // If not active but global factor is not zero, decay it
                currentRadialFactorRef.current *= spreadByAvgControls.decaySpeed;
                
                // If close to zero, snap to exactly zero
                if (currentRadialFactorRef.current < 0.01) {
                    currentRadialFactorRef.current = 0;
                }
            }
            
            // Apply the global radial factor if it's not zero, even when the effect is disabled
            if (!spreadByAvgControls.active && currentRadialFactorRef.current > 0) {
                const currentBaseRadius = particle.radius * currentRadiusMultiplier;
                const finalRadius = spreadByAvgControls.minRadius + currentRadialFactorRef.current;
                
                currentX = Math.cos(angle) * (currentBaseRadius * finalRadius) + xOffset;
                currentZ = Math.sin(angle) * (currentBaseRadius * finalRadius) + zOffset;
            }
            
            // Ensure scale is positive
            scaleVal = Math.max(0.001, scaleVal); 
            
            // --- LOG FINAL SCALE --- 
            if (scaleByAvgControls.debug && i === 0 && time % 1 < 0.02) { // Log only for first particle
                 console.log(`    -> Final Scale Applied: ${scaleVal.toFixed(3)} (CurrentMult: ${currentScaleMultiplier.current.toFixed(3)})`);
            }
            
            // Update particle position
            dummy.position.set(currentX, currentY, currentZ);
            
            // Apply the calculated scale
            dummy.scale.set(scaleVal, scaleVal, scaleVal);
            
            // Set rotation to zero
            dummy.rotation.set(0, 0, 0);
            
            // Update matrix
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        
        // Update instance matrix
        mesh.current.instanceMatrix.needsUpdate = true;
        
        // Apply group rotation to the entire instanced mesh
        if (mesh.current) {
            const targetRotationX = THREE.MathUtils.degToRad(generalSettings.groupRotation.x);
            const targetRotationZ = THREE.MathUtils.degToRad(generalSettings.groupRotation.z);
            let targetRotationY;
            // Calculate effective speed using the Leva factor
            const effectiveRotationSpeed = BASE_PARTICLE_Y_ROTATION_SPEED_RAD_PER_SEC * generalSettings.playingRotationSpeedFactor;

            // Only apply constant rotation if isPlaying AND enableDefaultRotation is true
            if (isPlaying && generalSettings.enableDefaultRotation) { 
                // Add incremental rotation based on delta time and effective speed
                // SUBTRACTING instead of adding for clockwise rotation
                targetRotationY = mesh.current.rotation.y - (effectiveRotationSpeed * delta);
                // Optional: Keep rotation within 0 to 2*PI range (using modulo for negative numbers correctly)
                targetRotationY = ((targetRotationY % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
            } else {
                // Use the Y rotation value from Leva controls when not playing OR rotation is disabled
                targetRotationY = THREE.MathUtils.degToRad(generalSettings.groupRotation.y);
            }

            mesh.current.rotation.set(
                targetRotationX,
                targetRotationY, 
                targetRotationZ
            );
        }
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial 
                color={initialMaterialProps.current.color}
                emissive={initialMaterialProps.current.emissive}
                emissiveIntensity={initialMaterialProps.current.emissiveIntensity}
                roughness={0.2} 
                metalness={0.8}
                toneMapped={false}
            />
        </instancedMesh>
    );
};

export default InstancedParticles; 