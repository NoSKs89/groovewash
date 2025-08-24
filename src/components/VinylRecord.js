import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring, animated, config } from '@react-spring/three';
import recordSvgPath from '../images/recordSVG.svg';
import dustSvgPath from '../images/dustParticle.svg';
import PulseRing from './PulseRing';
import InstancedParticles from './InstancedParticlesOriginal';

// Robust modulo function
const positiveModulo = (value, modulus) => {
    return ((value % modulus) + modulus) % modulus;
}

// --- Configurable Parameters --- 
const PULSE_MAX_RADIUS = 15;
const PULSE_DURATION = 1.5; // seconds
const PULSE_COLOR = 'orange';
const SAFE_MIN_RATE = 0.1; // Added for the new handlePointerDown logic
// --- Wobble Parameters ---
const NORMAL_WOBBLE_AMPLITUDE = 0.015;
const DIRTY_WOBBLE_AMPLITUDE = 0.045; // More dramatic wobble
const WOBBLE_FREQUENCY = 1;
// --- Shake Parameters ---
const SHAKE_DURATION_MS = 1400; // Duration of the shake animation
const SHAKE_AMPLITUDE = THREE.MathUtils.degToRad(15); // Max angle of the shake
// --- End Configurable Parameters ---

// Add currentBpm, mouseRef, and vinylTargetPosition to props
const VinylRecord = ({ 
  isPlaying, 
  audioRef, 
  currentBpm, 
  mouseRef, 
  onDragStart, 
  onDragEnd, 
  vinylTargetPosition, 
  isVinylFocused, 
  isCoverFocused, 
  albumTransitionState = 'idle', // Add transition state prop
  castShadow = true,
  analyserRef,
  frequencyData,
  isClean, // <<< Add isClean to props destructuring
}) => {
    const groupRef = useRef();
    const recordMeshRef = useRef();
    const dustMeshRef = useRef();
    const isRecordHeld = useRef(false);
    const previousMousePosition = useRef({ x: 0, y: 0 });
    const wasPlayingBeforeDrag = useRef(false);
    const previousAudioTimeRef = useRef(0); // Track time for scrub detection
    const { gl, clock } = useThree();
    const scrubTimeoutRef = useRef(null); // Ref for the scrub playback timeout
    const previousFullRotationsRef = useRef(0); // Ref to track rotations
    const rotationPeriodRef = useRef(0); // Ref to store rotation period
    const lastBeatTimeRef = useRef(0); // Ref to track the last beat time
    const beatIntervalRef = useRef(0); // Ref to store the beat interval
    const currentBeatPositionRef = useRef(1); // Ref to track beat position (1-4)
    const prevBpmRef = useRef(currentBpm); // Store previous BPM to detect changes
    const prevTransitionStateRef = useRef(albumTransitionState); // Track previous transition state
    const prevIsCleanRef = useRef(isClean); // Track previous isClean state

    // --- State for Shake Animation ---
    const [isShaking, setIsShaking] = useState(false);

    // --- Animate Group Position ---
    const { position: animatedPosition } = useSpring({
        to: { position: vinylTargetPosition },
        config: config.wobbly,
    });

    // Comment out albumTransitionState animation
    /*
    // --- Scale Animation for Transitions (driven by albumTransitionState prop) ---
    const { scale } = useSpring({
        // Start from current scale to allow interruptions? Or always from 1/0.25?
        // Let's try simpler: reset based on target state
        to: { scale: (albumTransitionState === 'shrinking' ? 0.25 : 1) },
        from: { scale: (albumTransitionState === 'expanding' ? 0.25 : 1) }, // From opposite state
        reset: true, // Reset animation when state changes
        config: albumTransitionState === 'shrinking' ? config.gentle : config.wobbly,
        onRest: () => {
            console.log(`Scale animation completed: ${scale.get()}`);
        }
    });
    */
    
    // Always use scale 1
    const { scale } = useSpring({
        to: { scale: 1 },
        config: config.wobbly,
    });

    // --- Spring for Shake Animation (X-axis offset) ---
    const { shakeXOffset } = useSpring({
        to: async (next, cancel) => {
            if (isShaking) {
                await next({ shakeXOffset: SHAKE_AMPLITUDE, config: config.wobbly });
                await next({ shakeXOffset: -SHAKE_AMPLITUDE, config: config.wobbly });
                await next({ shakeXOffset: SHAKE_AMPLITUDE / 2, config: config.wobbly });
                await next({ shakeXOffset: -SHAKE_AMPLITUDE / 2, config: config.wobbly });
                await next({ shakeXOffset: SHAKE_AMPLITUDE, config: config.wobbly });
                await next({ shakeXOffset: -SHAKE_AMPLITUDE, config: config.wobbly });
                await next({ shakeXOffset: SHAKE_AMPLITUDE / 2, config: config.wobbly });
                await next({ shakeXOffset: -SHAKE_AMPLITUDE / 2, config: config.wobbly });
                await next({ shakeXOffset: 0, config: config.wobbly });
            } else {
                await next({ shakeXOffset: 0, immediate: true }); // Reset immediately if not shaking
            }
        },
        from: { shakeXOffset: 0 },
        reset: isShaking, // Reset animation when isShaking becomes true
        onRest: () => {
            if (isShaking) setIsShaking(false); // Turn off shaking after animation completes
        }
    });

    // --- Effect to Trigger Shake on Clean ---
    useEffect(() => {
        if (isClean && !prevIsCleanRef.current) { // Transitioned from dirty to clean
            console.log("VinylRecord: Transitioned to CLEAN, triggering shake!");
            setIsShaking(true); 
            // The onRest of the shakeSpring will set isShaking to false.
            // Alternatively, a timeout could be used here if onRest is not reliable enough or for fixed duration.
            // setTimeout(() => setIsShaking(false), SHAKE_DURATION_MS); // Example fixed duration
        }
        prevIsCleanRef.current = isClean;
    }, [isClean]);

    // --- Handle Album Transition State Changes ---
    // Comment out the effect that reacts to albumTransitionState changes
    /*
    useEffect(() => {
        if (albumTransitionState !== prevTransitionStateRef.current) {
            console.log(`VinylRecord: Transition state changed to ${albumTransitionState}`);
            prevTransitionStateRef.current = albumTransitionState;
            // Spring above should handle the actual animation based on the state prop
        }
    }, [albumTransitionState]);
    */

    // Constants
    const RECORD_RPM = 33.333;
    const recordRotationSpeed = (RECORD_RPM / 60) * Math.PI * 2;
    const dustRotationSpeed = -recordRotationSpeed * 0.05;
    const SCRUB_THRESHOLD = 0.1; // Min time diff (sec) to detect timeline scrub
    const FOCUSED_TILT_BACK_ANGLE = THREE.MathUtils.degToRad(8); // Added constant for tilt

    // State
    const [recordCanvasTexture, setRecordCanvasTexture] = useState(null);
    const textureResolution = 4096;
    const [audioDuration, setAudioDuration] = useState(0);
    const [pulses, setPulses] = useState([]);
    
    // --- Calculate Beat Interval from BPM --- 
    useEffect(() => {
        if (currentBpm && currentBpm > 0) {
            // Calculate seconds per beat (quarter note) from BPM
            const secondsPerBeat = 60 / currentBpm;
            beatIntervalRef.current = secondsPerBeat;
            console.log(`Beat interval updated to ${secondsPerBeat.toFixed(3)}s (${currentBpm} BPM)`);
        } else {
            beatIntervalRef.current = 0; // Reset if BPM is invalid
        }
    }, [currentBpm]);

    // --- Reset Beat Tracking on Pause --- 
    useEffect(() => {
        if (!isPlaying) {
            // Reset beat tracking refs when playback stops
            if (audioRef.current) { // Ensure audioRef is available
                 lastBeatTimeRef.current = audioRef.current.currentTime;
                 // Reset beat position to 1 when stopped
                 currentBeatPositionRef.current = 1;
                 console.log(`Playback stopped/paused. Resetting beat tracking. Last beat time set to ${lastBeatTimeRef.current.toFixed(3)}`);
            }
        }
        // We might need to add logic here if isPlaying becomes true again after a pause
        // to re-align lastBeatTimeRef, similar to the post-scrub logic.
    }, [isPlaying, audioRef]); // Depend on isPlaying and audioRef

    // --- Calculate Rotation Period --- 
    useEffect(() => {
        if (recordRotationSpeed > 0) {
            rotationPeriodRef.current = (2 * Math.PI) / recordRotationSpeed;
        }
    }, [recordRotationSpeed]);

    // --- Initialization Effect for Previous Time ---
    useEffect(() => {
        if (audioRef.current) {
            previousAudioTimeRef.current = audioRef.current.currentTime || 0;
        }
    }, [audioRef]); // Run when audioRef is available

    // --- High-Quality Texture Generation --- 
    useEffect(() => {
        let isMounted = true;
        let objectUrl = null;
        fetch(recordSvgPath)
            .then(response => { if (!response.ok) throw new Error('Failed to fetch SVG'); return response.text(); })
            .then(svgString => {
                const img = new Image();
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                objectUrl = URL.createObjectURL(svgBlob);
                img.onload = () => {
                    if (!isMounted) { URL.revokeObjectURL(objectUrl); return; }
                    const canvas = document.createElement('canvas');
                    canvas.width = textureResolution; canvas.height = textureResolution;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, textureResolution, textureResolution);
                    URL.revokeObjectURL(objectUrl); objectUrl = null;
                    const texture = new THREE.CanvasTexture(canvas);
                    texture.needsUpdate = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = true;
                    if (isMounted) { setRecordCanvasTexture(texture); }
                    else { texture.dispose(); }
                };
                img.onerror = (err) => { console.error("SVG Load Error:", err); if(objectUrl) URL.revokeObjectURL(objectUrl); };
                img.src = objectUrl;
            })
            .catch(error => { console.error("SVG Fetch Error:", error); });
        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            setRecordCanvasTexture(currentTexture => { currentTexture?.dispose(); return null; });
        };
    }, [recordSvgPath, textureResolution]);

    // --- Effect to get audio duration --- 
    useEffect(() => {
        const audio = audioRef.current;
        const handleLoadedMetadata = () => {
             if (audio && isMounted) {
                const duration = audio.duration;
                if (duration && isFinite(duration)) {
                    setAudioDuration(duration);
                } else { setAudioDuration(0); }
            }
        };
        let isMounted = true;
        if (audio) {
            if (audio.readyState >= 1 && isFinite(audio.duration)) { handleLoadedMetadata(); }
            else { audio.addEventListener('loadedmetadata', handleLoadedMetadata); }
        }
        return () => {
            isMounted = false;
            if (audio) { audio.removeEventListener('loadedmetadata', handleLoadedMetadata); }
        };
    }, [audioRef]);

    // --- Load Dust Texture --- 
    const dustTexture = useLoader(THREE.TextureLoader, dustSvgPath);
    useMemo(() => {
        if (dustTexture) { 
            dustTexture.minFilter = THREE.LinearMipmapLinearFilter;
            dustTexture.magFilter = THREE.LinearFilter;
            dustTexture.generateMipmaps = true;
         }
    }, [dustTexture]);

    // --- Animation Logic with Pulse Ring Trigger --- 
    useFrame((state, delta) => {
        const audio = audioRef.current;
        const group = groupRef.current;
        
        // *** If record is held, let the drag handler control rotation ***
        if (isRecordHeld.current) {
            // handlePointerMove updates rotation and audio.currentTime directly
            if (group) {
                 // Logic from handlePointerMove that rotates the group:
                 const currentAudioTime = audioRef.current.currentTime;
                 const newSeekTime = currentAudioTime; // Placeholder, actual seek time is calculated in handler
                 const targetYRotation = -newSeekTime * recordRotationSpeed;
                 const dragYRotation = positiveModulo(targetYRotation, 2 * Math.PI);
                 
                 // Apply dynamic wobble during drag as well
                 const currentWobbleAmplitude = !isClean ? DIRTY_WOBBLE_AMPLITUDE : NORMAL_WOBBLE_AMPLITUDE;
                 const wobbleXRotation = Math.sin(dragYRotation * WOBBLE_FREQUENCY) * currentWobbleAmplitude;
                 
                 const tiltXOffset = isVinylFocused ? FOCUSED_TILT_BACK_ANGLE : 0;
                 // Only add shake offset if playing
                 const currentShakeOffset = isPlaying ? shakeXOffset.get() : 0;
                 const dragXRotation = Math.PI / 2 + wobbleXRotation + tiltXOffset + currentShakeOffset;
                 group.rotation.set(dragXRotation, dragYRotation, 0);
            }
            return;
        }
        
        if (!group || !audio || !audioDuration) return; // Added audioDuration check back

        const currentAudioTime = audio.currentTime;
        const isAudioPlaying = !audio.paused; // Check if audio is actually playing

        // --- Calculate Absolute Rotation based on Audio Time ---
        // Rotation should always reflect the audio's current time,
        // regardless of whether it's playing, paused, scrubbing, or ramping.
        const targetYRotation = -currentAudioTime * recordRotationSpeed;
        const currentYRotation = positiveModulo(targetYRotation, 2 * Math.PI);

        // Determine current wobble amplitude based on isClean state
        const currentWobbleAmplitude = !isClean ? DIRTY_WOBBLE_AMPLITUDE : NORMAL_WOBBLE_AMPLITUDE;
        const wobbleXRotation = Math.sin(currentYRotation * WOBBLE_FREQUENCY) * currentWobbleAmplitude;

        // --- Calculate Tilt --- 
        const tiltXOffset = isVinylFocused ? FOCUSED_TILT_BACK_ANGLE : 0;

        // --- Apply Rotation (Absolute Y + Wobble X + Tilt X + Conditional Shake X) ---
        // Only add shake offset if playing
        const currentShakeOffset = isPlaying ? shakeXOffset.get() : 0;
        const currentXRotation = Math.PI / 2 + wobbleXRotation + tiltXOffset + currentShakeOffset;
        group.rotation.set(currentXRotation, currentYRotation, 0);
        
        // --- BPM-based Pulse Ring Trigger Logic --- 
        // Trigger pulses only if App intends to play (isPlaying) AND audio is actually playing
        if (isPlaying && isAudioPlaying && currentBpm > 0 && beatIntervalRef.current > 0) {
            // Calculate how many beats have occurred since the last one we tracked
            const timeSinceLastBeat = currentAudioTime - lastBeatTimeRef.current;
            // Access the interval value from the ref
            const beatInterval = beatIntervalRef.current;
            
            // If we've passed the time for the next beat
            if (timeSinceLastBeat >= beatInterval) {
                // How many complete beats have passed
                const beatsElapsed = Math.floor(timeSinceLastBeat / beatInterval);
                
                // Calculate the beat position for the *first* beat being triggered now
                const beatPosition = (currentBeatPositionRef.current % 4) === 0 ? 4 : (currentBeatPositionRef.current % 4);
                
                // --- Calculate props based on beat position --- 
                const amplitudeMap = { 1: 0.06, 2: 0.05, 3: 0.055, 4: 0.03 };
                const calculatedAmplitude = amplitudeMap[beatPosition] || 0.06;
                const thicknessMap = { 1: 0.036, 2: 0.024, 3: 0.012, 4: 0.006 };
                const calculatedThickness = thicknessMap[beatPosition] || 0.005;
                const randomSpatialFreq = 4 + Math.random() * 4;
                const randomTemporalFreq = 2 + Math.random() * 3;
                const pulseColor = isCoverFocused ? 'teal' : 'gold';

                const newPulse = {
                    id: `${Date.now()}-${Math.random()}`,
                    creationTime: clock.getElapsedTime(),
                    maxRadius: PULSE_MAX_RADIUS,
                    duration: PULSE_DURATION,
                    color: pulseColor, 
                    wobbleAmplitude: calculatedAmplitude,
                    wobbleFrequencySpatial: randomSpatialFreq,
                    wobbleFrequencyTemporal: randomTemporalFreq,
                    ringThickness: calculatedThickness,
                    beatPosition: beatPosition,
                };
                setPulses((currentPulses) => [...currentPulses, newPulse]);
                // console.log(`Pulse Ring triggered! Beat#: ${beatPosition}, Amp: ${calculatedAmplitude.toFixed(3)}, Thick: ${calculatedThickness.toFixed(4)}`);
                
                // Update the last beat time based on elapsed beats to maintain grid alignment
                lastBeatTimeRef.current += beatsElapsed * beatInterval;
                // Update the beat position counter
                currentBeatPositionRef.current += beatsElapsed;
            }
        }
        
        // Update previous time ref for potential future use (e.g., beat alignment after external scrub)
        previousAudioTimeRef.current = currentAudioTime;

        // Dust Rotation (unchanged)
        if (dustMeshRef.current) {
            dustMeshRef.current.rotation.y += dustRotationSpeed * delta;
            dustMeshRef.current.rotation.y = positiveModulo(dustMeshRef.current.rotation.y, 2 * Math.PI);
        }
    });

    // Handler to remove completed pulses from state
    const handlePulseComplete = (idToRemove) => {
        setPulses((currentPulses) =>
          currentPulses.filter((pulse) => pulse.id !== idToRemove)
        );
    };

    // Optional: Periodic cleanup (from example)
    useEffect(() => {
        const intervalId = setInterval(() => {
          const now = clock.getElapsedTime();
          setPulses((currentPulses) =>
            currentPulses.filter(
              (pulse) => now - pulse.creationTime < pulse.duration + 0.5 // Keep a little longer
            )
          );
        }, 2000); // Check every 2 seconds
    
        return () => clearInterval(intervalId);
      }, [clock, PULSE_DURATION]); // Depend on clock and duration

    // --- Pointer Event Handlers --- 
    const handlePointerDown = (event) => {
        console.log("VinylRecord: handlePointerDown Fired"); 
        event.stopPropagation();
        
        // ADDED LOGGING FOR CONDITIONS
        const conditions = {
            isCorrectObject: event.object === recordMeshRef.current,
            hasTexture: !!recordCanvasTexture,
            hasAudioRef: !!audioRef.current,
            hasDuration: audioDuration > 0,
        };
        console.log("VinylRecord: handlePointerDown Conditions:", conditions);
        
        if (conditions.isCorrectObject && conditions.hasTexture && conditions.hasAudioRef && conditions.hasDuration) {
            console.log("VinylRecord: Pointer down conditions MET");
            
            // Store if playing *before* potentially pausing
            wasPlayingBeforeDrag.current = !audioRef.current.paused;

            if (wasPlayingBeforeDrag.current) {
                console.log("Audio was playing. Pausing, muting, and setting rate for drag...");
                audioRef.current.pause(); // Explicitly PAUSE if it was playing
            } else {
                 console.log("Audio was paused. Keeping paused, muting, and setting rate for drag...");
                 // No need to call pause() again if it was already paused
            }

            audioRef.current.volume = 0; // Mute for the drag duration
            audioRef.current.playbackRate = 1; // Set rate to 1; playback is controlled by pause()

            isRecordHeld.current = true;
            previousMousePosition.current = { x: event.clientX, y: event.clientY };
            
            if (onDragStart) onDragStart();

            try {
                event.target.setPointerCapture(event.pointerId);
                if (groupRef.current) groupRef.current.scale.setScalar(1.02);
            } catch (err) {
                console.error("Error setting pointer capture:", err);
                isRecordHeld.current = false;
                // Restore state immediately on error
                if (audioRef.current) {
                    audioRef.current.volume = 1; // Restore volume
                    if (wasPlayingBeforeDrag.current) {
                        audioRef.current.playbackRate = 1;
                        audioRef.current.play().catch(e => console.error("Error resuming after failed capture:", e));
                    } else {
                        audioRef.current.playbackRate = 0;
                        // No need to pause, it was already paused
                    }
                }
                wasPlayingBeforeDrag.current = false;
                if (onDragEnd) onDragEnd();
            }
        } else {
            console.log("Pointer down ignored (conditions not met or wrong object)");
        }
    };

    const handlePointerMove = (event) => {
        console.log("VinylRecord: handlePointerMove Fired"); 
        event.stopPropagation();
        if (!isRecordHeld.current || !audioRef.current || !groupRef.current || audioDuration <= 0) {
            // ADDED LOGGING FOR MOVE CONDITIONS
            console.log(`VinylRecord: handlePointerMove SKIPPED - isRecordHeld=${isRecordHeld.current}, hasAudio=${!!audioRef.current}, hasGroup=${!!groupRef.current}, hasDuration=${audioDuration > 0}`);
            return;
        }
        console.log(`handlePointerMove: Executing while dragging.`);

        try {
            const currentMousePosition = { x: event.clientX, y: event.clientY };
            let angleChange = 0;
            const vecCenter = new THREE.Vector3();
            groupRef.current.getWorldPosition(vecCenter);
            vecCenter.project(event.camera);
            console.log(`  > Projected Center (NDC): x=${vecCenter.x.toFixed(3)}, y=${vecCenter.y.toFixed(3)}`);

            if (!isNaN(vecCenter.x) && !isNaN(vecCenter.y)) {
                const canvasWidth = gl.domElement.clientWidth;
                const canvasHeight = gl.domElement.clientHeight;
                const screenCenterX = (vecCenter.x * 0.5 + 0.5) * canvasWidth;
                const screenCenterY = (-vecCenter.y * 0.5 + 0.5) * canvasHeight;
                console.log(`  > Screen Center (px): x=${screenCenterX.toFixed(1)}, y=${screenCenterY.toFixed(1)}`);
                console.log(`  > Mouse Position (px): x=${event.clientX.toFixed(1)}, y=${event.clientY.toFixed(1)}`);
                console.log(`  > Prev Mouse Position (px): x=${previousMousePosition.current.x.toFixed(1)}, y=${previousMousePosition.current.y.toFixed(1)}`);

                if (!isNaN(screenCenterX) && !isNaN(screenCenterY)) {
                    const vecPrev = new THREE.Vector2(
                        previousMousePosition.current.x - screenCenterX,
                        screenCenterY - previousMousePosition.current.y
                    );
                    const vecCurr = new THREE.Vector2(
                        currentMousePosition.x - screenCenterX,
                        screenCenterY - currentMousePosition.y
                    );
                    console.log(`  > VecPrev: x=${vecPrev.x.toFixed(1)}, y=${vecPrev.y.toFixed(1)}, lenSq=${vecPrev.lengthSq().toFixed(1)}`);
                    console.log(`  > VecCurr: x=${vecCurr.x.toFixed(1)}, y=${vecCurr.y.toFixed(1)}, lenSq=${vecCurr.lengthSq().toFixed(1)}`);

                    if (vecPrev.lengthSq() > 0 && vecCurr.lengthSq() > 0) {
                        const prevAngle = vecPrev.angle();
                        const currAngle = vecCurr.angle();
                        console.log(`  > Prev Angle: ${prevAngle.toFixed(4)}, Curr Angle: ${currAngle.toFixed(4)}`);
                        angleChange = currAngle - prevAngle;
                        if (isNaN(angleChange)) {
                            console.log(`  >> AngleChange calculated as NaN, setting to 0.`);
                            angleChange = 0;
                        }
                        if (Math.abs(angleChange) > Math.PI) {
                             console.log(`  >> AngleChange ${angleChange.toFixed(4)} exceeds PI, adjusting.`);
                            angleChange = angleChange < 0 ? angleChange + 2 * Math.PI : angleChange - 2 * Math.PI;
                        }
                        const MAX_ANGLE_CHANGE = Math.PI / 2;
                        if (Math.abs(angleChange) > MAX_ANGLE_CHANGE) {
                             console.log(`  >> AngleChange ${angleChange.toFixed(4)} exceeds MAX (${MAX_ANGLE_CHANGE.toFixed(4)}), clamping.`);
                             angleChange = Math.max(-MAX_ANGLE_CHANGE, Math.min(MAX_ANGLE_CHANGE, angleChange));
                        }
                    } else {
                        console.log(`  >> Vector length zero, skipping angle calculation.`);
                    }
                } else {
                     console.log(`  >> Projected Center is NaN, skipping angle calculation.`);
                }
            } else {
                 console.log(`  >> Projected Center is NaN, skipping angle calculation.`);
            }
            
            console.log(`  > Angle Change: ${angleChange.toFixed(4)}`);
            const scrubSensitivity = 5;
            const seekChange = -angleChange * scrubSensitivity;
            console.log(`  > Seek Change: ${seekChange.toFixed(4)}`);
            
            if (!isNaN(seekChange) && Math.abs(seekChange) > 0.001) {
                const currentAudioTime = audioRef.current.currentTime;
                let newSeekTime = currentAudioTime + seekChange;
                newSeekTime = Math.max(0, Math.min(audioDuration, newSeekTime));
                console.log(`  > Current Time: ${currentAudioTime.toFixed(3)}, New Seek Time: ${newSeekTime.toFixed(3)}`);

                const timeDiff = Math.abs(newSeekTime - currentAudioTime);
                const seeking = audioRef.current.seeking;
                console.log(`  > Time Diff: ${timeDiff.toFixed(3)}, Seeking: ${seeking}`);

                if (timeDiff > 0.01 && !seeking) {
                    console.log(`  >> Applying currentTime: ${newSeekTime.toFixed(3)}`);
                    try {
                        audioRef.current.currentTime = newSeekTime;

                        // --- Auditory Scrub Feedback ---
                        audioRef.current.playbackRate = 1;
                        audioRef.current.volume = 1;
                        if (scrubTimeoutRef.current) {
                            clearTimeout(scrubTimeoutRef.current);
                        }
                        scrubTimeoutRef.current = setTimeout(() => {
                            // Check isRecordHeld here
                            if (isRecordHeld.current && audioRef.current) {
                                // audioRef.current.playbackRate = SAFE_MIN_RATE; // No longer needed here
                                audioRef.current.volume = 0; // Re-mute after feedback
                                console.log("  >> Resetting volume after scrub playback");
                            }
                            scrubTimeoutRef.current = null;
                        }, 50);
                        // --- End Auditory Scrub Feedback ---

                    } catch (e) {
                        console.error("Error seeking/playing audio during scrub:", e);
                    }
                } else {
                     console.log(`  >> Condition not met to apply currentTime.`);
                }
                
                // Update visual rotation IMMEDIATELY during drag
                if (groupRef.current) {
                    const targetYRotation = -newSeekTime * recordRotationSpeed;
                    const dragYRotation = positiveModulo(targetYRotation, 2 * Math.PI);
                    
                    // Calculate wobble and tilt for drag with dynamic amplitude
                    const currentWobbleAmplitude = !isClean ? DIRTY_WOBBLE_AMPLITUDE : NORMAL_WOBBLE_AMPLITUDE;
                    const wobbleXRotation = Math.sin(dragYRotation * WOBBLE_FREQUENCY) * currentWobbleAmplitude;
                    const tiltXOffset = isVinylFocused ? FOCUSED_TILT_BACK_ANGLE : 0;
                    // Only add shake offset if playing
                    const currentShakeOffset = isPlaying ? shakeXOffset.get() : 0;
                    const dragXRotation = Math.PI / 2 + wobbleXRotation + tiltXOffset + currentShakeOffset;
                    console.log(`handlePointerMove: isVinylFocused=${isVinylFocused}, tiltOffset=${tiltXOffset.toFixed(3)}, finalXRot=${dragXRotation.toFixed(3)}`);
                    
                    groupRef.current.rotation.set(dragXRotation, dragYRotation, 0);
                }
            } else {
                 console.log(`  > Seek change too small or NaN, skipping update.`);
            }

            previousMousePosition.current = currentMousePosition;

        } catch (err) {
            console.error("Error in pointer move handler:", err);
        }
    };

    const handlePointerUpOrCancel = (event, type) => {
        console.log(`VinylRecord: handlePointerUpOrCancel Fired (type: ${type})`); 
        event.stopPropagation();
        if (!isRecordHeld.current) {
            console.log("VinylRecord: handlePointerUpOrCancel SKIPPED - record not held"); 
            return;
        }
        console.log(`VinylRecord: Pointer ${type} - Record Released`); 
        isRecordHeld.current = false;

        // Clear any pending scrub timeout
        if (scrubTimeoutRef.current) {
            clearTimeout(scrubTimeoutRef.current);
            scrubTimeoutRef.current = null;
             console.log("Cleared pending scrub timeout on pointer up/cancel.");
        }

        if (onDragEnd) onDragEnd();

        if (event.target.hasPointerCapture?.(event.pointerId)) {
            try { event.target.releasePointerCapture(event.pointerId); }
            catch (err) { console.error(`Error releasing capture on ${type}:`, err); }
        }
        if (groupRef.current) groupRef.current.scale.setScalar(1.0);

        // Restore volume and playback state
        if (audioRef.current) {
           audioRef.current.volume = 1; // Restore volume first
           const beatInterval = beatIntervalRef.current; // Get current beat interval
           const currentAudioTime = audioRef.current.currentTime;
           
           if (wasPlayingBeforeDrag.current) {
               console.log("Resuming playback after drag");
               audioRef.current.playbackRate = 1; // Ensure rate is 1 before playing
               audioRef.current.play().catch(e => console.error("Error resuming audio after drag:", e));
               
               // --- Align Beat Tracking for Resume ---
               if (beatInterval > 0) {
                   const beatsPassedTotal = Math.floor(currentAudioTime / beatInterval);
                   const previousBeatTime = beatsPassedTotal * beatInterval;
                   lastBeatTimeRef.current = previousBeatTime;
                   currentBeatPositionRef.current = (beatsPassedTotal % 4) + 1; // Calculate beat position (1-4)
                   console.log(`Drag ended (Resuming). Aligned beat tracking. Prev Beat Time: ${previousBeatTime.toFixed(3)}, Beat Pos: ${currentBeatPositionRef.current}`);
               } else {
                   // Fallback if interval is somehow 0
                   lastBeatTimeRef.current = currentAudioTime;
                   currentBeatPositionRef.current = 1;
                   console.log("Drag ended (Resuming). Beat interval 0, fallback reset.");
               }
               // -------------------------------------
           } else {
               console.log("Ensuring audio is paused after drag");
               // Remove setting playbackRate to 0, just ensure pause
               // audioRef.current.playbackRate = 0; 
               audioRef.current.pause(); // Explicitly pause if it wasn't playing before
               
               // Reset beat tracking since we are stopping/staying paused
               lastBeatTimeRef.current = currentAudioTime;
               currentBeatPositionRef.current = 1;
               console.log(`Drag ended (Staying Paused). Reset beat tracking. Last beat time: ${lastBeatTimeRef.current.toFixed(3)}`);
           }
        }
        wasPlayingBeforeDrag.current = false;
    };

    // Memoized geometries
    const recordGeometry = useMemo(() => new THREE.CylinderGeometry(2, 2, 0.05, 64), []);
    const dustGeometry = useMemo(() => new THREE.PlaneGeometry(4.1, 4.1), []);

    return (
        <>
            {/* Group containing ONLY the record and dust - this group rotates */}
            <animated.group
                ref={groupRef}
                rotation={[Math.PI / 2, 0, 0]} // Initial static rotation
                position={animatedPosition} // Use animated position for record/dust
                scale={scale}
            >
                 <mesh
                    ref={recordMeshRef}
                    geometry={recordGeometry}
                    userData={{ name: "RecordMesh" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUpOrCancel(e, 'up')}
                    onPointerCancel={(e) => handlePointerUpOrCancel(e, 'cancel')}
                    onPointerLeave={(e) => { if (isRecordHeld.current && e.target.hasPointerCapture?.(e.pointerId)) { handlePointerUpOrCancel(e, 'leave'); } }}
                    castShadow={castShadow}
                 >
                    {recordCanvasTexture ? (
                        <meshStandardMaterial map={recordCanvasTexture} 
                        side={THREE.FrontSide} transparent={true} alphaTest={0.1} 
                        emissiveIntensity={0.1}
                        emissive="black"
                        metalness={0.3} // Experiment with values between 0.0 and 0.3
                        />
                    ) : (
                        <meshBasicMaterial color="#333" wireframe={false} />
                    )}
                </mesh>

                {dustTexture && (
                     <mesh
                        ref={dustMeshRef}
                        position={[0, 0.03, 0]} 
                        geometry={dustGeometry}
                        userData={{ name: "DustMesh" }}
                        castShadow={castShadow}
                        raycast={() => null} // Make dust non-interactive
                     >
                        <meshStandardMaterial map={dustTexture} transparent={true} opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
                     </mesh>
                 )}

                 {/* Render active pulse rings (relative to this group) */}
                 {pulses.map((pulse) => (
                    <PulseRing key={pulse.id} {...pulse} onComplete={handlePulseComplete} />
                 ))}

                 {/* MOVE Instanced Particles BACK INSIDE the rotating group */}
                 <InstancedParticles
                     count={175} // Adjust count as needed
                     mouse={mouseRef} // Pass mouse ref if needed for interaction (currently unused)
                     analyserRef={analyserRef}
                     frequencyData={frequencyData}
                     isClean={isClean} // <<< Pass isClean to InstancedParticles
                 />
            </animated.group>
        </>
    );
};

// Memoize the main VinylRecord component BEFORE exporting
const MemoizedVinylRecord = React.memo(VinylRecord);

// Export the memoized version
export default MemoizedVinylRecord; 