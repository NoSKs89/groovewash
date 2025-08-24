import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// Import base useSpring for web, alias three-specific versions
import { useSpring, animated, config } from '@react-spring/web';
import { useSpring as useSpringThree, animated as animatedThree } from '@react-spring/three';
import * as THREE from 'three';
import VinylRecord from './VinylRecord';
// Import the new camera component
import AnimatedCamera from './AnimatedCamera';
import AlbumCover from './AlbumCover'; // Import the new component
import Bubble from './Bubble'; // Import the new Bubble component
import NeonSign from './NeonSign'; // Import the NeonSign component
// import InstancedParticles from './InstancedParticles'; // UPDATED IMPORT - Commented out
import AudioPlaneParticles from './AudioPlaneParticles'; // NEW IMPORT
import ahmadJamalDigitalWorks from '../images/Ahmad_Jamal_DigitalWorks.jpg'; // Changed from AbbeyRoad.jpg
import beethovenBruno from '../images/Beethoven_Bruno.jpg'; // 1. Import the second image
import bandOfSkulls from '../images/Band_Of_Skulls_Himalayan.jpg'; // 1. Import Fresh Cream image
import { EffectComposer, Outline, Bloom } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing'; // Optional: For Bloom kernel size
// Import Leva and useControls
import { useControls, Leva } from 'leva'; 
import { Helmet } from 'react-helmet-async'; // Import Helmet for potential individual image structured data if needed


// --- Static Configs (Replaced Leva useControls for these sections) ---
const PIGPEN_DUST_CONFIG = {
    count: 20,
    radius: 2.2,
    dashRatio: 0.72,
    dashArray: 1.17,
    lineWidth: 0.01,
    lineWidthVariance: 0,
    speedFactor: 1,
    dustBaseColor: 'grey',
    dustEmissiveColor: 'white',
    dustEmissiveIntensity: 5,
};

const BLOOM_CONFIG = {
    bloomLuminanceThreshold: 0.9,
    bloomIntensity: 1.5,
    // levels: 6, // Kept constant in Bloom component directly
    // mipmapBlur: true, // Kept constant in Bloom component directly
};
// --- End Static Configs ---


// --- Define Cover Data ---
// This array holds metadata specifically for the *visual representation* of each album cover
// within the RecordAnimation component. It includes:
// - title: Used for identification and potentially passed up to App.js.
// - imageUrl: Path to the image file used for the AlbumCover texture.
// - position/rotationDeg: Initial *resting* position and rotation in the 3D scene when nothing is focused.
// - bpm: The BPM associated with this album. While defined here initially, the *active* BPM used
//        for effects like pulse rings in VinylRecord is passed down as a prop (`currentBpm`) from App.js,
//        which gets its value from App.js's `albumBpmMap` based on the `activeAlbumTitle`.
// NOTE: This component does NOT import or directly manage the audio *files* themselves.
//       It only triggers a change in the active album title via the `onActiveAlbumChange` callback prop.
const coverData = [
  { 
    title: 'Ahmad Jamal',
    albumName: 'Digital Works', // Adding album name for richer alt text
    artistName: 'Ahmad Jamal', // Adding artist name
    imageUrl: ahmadJamalDigitalWorks,
    position: [-14.00, 9.00, 0.30],
    rotationDeg: [-12, 38, 0],
    bpm: 175.5
  },
  { 
    title: 'Beethoven Bruno',
    albumName: 'Symphony No. 6 "Pastorale"', // Adding album name
    artistName: 'Ludwig van Beethoven (Cond: Bruno Walter)', // Adding artist name
    imageUrl: beethovenBruno,
    position: [-13.05, 9.08, 0.25],
    rotationDeg: [-13, 43, 23],
    bpm: 92.7
  },
  { 
    title: 'Band Of Skulls',
    albumName: 'Himalayan', // Adding album name
    artistName: 'Band Of Skulls', // Adding artist name
    imageUrl: bandOfSkulls,
    position: [-12.10, 9.16, 2.20],
    rotationDeg: [41, 5, -34],
    bpm: 99.2
  }
  // Add more covers here later
];
// --- End Cover Data ---

// --- Define Focus Geometry --- 
// These constants define the target positions, rotations, and scales for covers and the vinyl
// when different elements (a specific cover, the vinyl, or nothing) are focused.
// They control the layout and animation targets within this component.
const FOCUSED_COVER_POSITION = [0, -0.27, 0.1]; // Adjusted Y
// const FOCUSED_COVER_POSITION = [0, 0, 0.1]; // Original Base position for focused covers
const FOCUSED_COVER_ROTATION_DEG = [0, 0, 0]; // Base rotation for focused covers
// const UNFOCUSED_OFFSET_Z = 0.15; // Remove Z offset
const UNFOCUSED_SPACING_X = 1.5; // Define X spacing for the card fan
// Rename X rotation to Y rotation
const UNFOCUSED_ROTATION_Y_DEG = 15; // Rotate around Y for card fan effect
// const UNFOCUSED_ROTATION_X_DEG = 20; // Remove X rotation
const VINYL_PUSHBACK_Z = -1.5; // How far back the vinyl moves
const VINYL_PUSHBACK_Y = -0.5; 

// --- Define Cover Scale FIRST ---
const BASE_COVER_SCALE = 4.2; // Original scale
const FOCUSED_COVER_SCALE = BASE_COVER_SCALE * 0.64; // 64% of original scale when focused

// --- Define Offsets/Spacing using Scale ---
// Lower active cover by 20% of its focused height
const ACTIVE_COVER_Y_OFFSET = -(FOCUSED_COVER_SCALE * 0.20);
const ACTIVE_COVER_Z_OFFSET = 0.1; // Small offset to bring active cover forward
const INACTIVE_COVER_BASE_Z = FOCUSED_COVER_POSITION[2]; // Base Z for inactive covers (relative to focused Z)
const FOCUSED_BACKWARD_TILT_DEG = 15; // Tilt all covers back when focused

// --- Hardcoded Values (Replacing Leva Controls) ---
const LIGHT_POSITION = [7.5, -17.5, 6];
const LIGHT_ROTATION = [7, -1, -2];
const LIGHT_INTENSITY = 1.8;
const LIGHT_CAST_SHADOW = true;
const LIGHT_SHADOW_BIAS = -0.001;
const LIGHT_SHADOW_RADIUS = 1;

const PLANE_POSITION = [-10, 15, -6];
const PLANE_ROTATION = [15.3, 2.3, 2.0];
const PLANE_SIZE = 20;
const PLANE_COLOR = "#000000";
const PLANE_OPACITY = 0;
const PLANE_SHADOW_OPACITY = 0.14;

const SHADOW_MAP_SIZE = 1024;
const SHADOW_BIAS = -0.001; // Note: This seems redundant with LIGHT_SHADOW_BIAS
const SHADOW_NORMAL_BIAS = 0.01;

// --- Hardcoded Bubble Properties ---
const BUBBLE1_PROPS = {
    position: [0, 0.5, -3.5],
    rotation: [0, 0, 0].map(THREE.MathUtils.degToRad), // Convert degrees to radians here
    initialScale: 0.4,
    distort: 0.55,
    transmission: 1.95,
    thickness: -1.2,
    floatIntensity: 3.9,
    floatSpeed: 1.6
};

const BUBBLE2_PROPS = {
    position: [-3, 6, 1.5],
    rotation: [0, 0, 0].map(THREE.MathUtils.degToRad),
    initialScale: 0.4,
    distort: 0.8,
    transmission: 1.95,
    thickness: -1.0,
    floatIntensity: 0,
    floatSpeed: 0.6
};

const BUBBLE3_PROPS = {
    position: [2, 1, -4], // From last Leva state
    rotation: [0, 0, 0].map(THREE.MathUtils.degToRad),
    initialScale: 0.9,
    distort: 0.6,
    transmission: 1.95,
    thickness: -0.8,
    floatIntensity: 3.5,
    floatSpeed: 0.1
};

// --- Bubble 4 Props (from Leva) ---
const BUBBLE4_PROPS = {
    position: [-4, 3, 1],
    rotation: [7, 0, 0].map(THREE.MathUtils.degToRad),
    initialScale: 0.5,
    distort: 0.8,
    transmission: 1.96,
    thickness: -0.9,
    floatIntensity: 0,
    floatSpeed: 1.4
};

// --- Neon Sign Props (from Leva) ---
const NEON_SIGN_PROPS = {
    position: [-4.25, 3.3, 2.5],
    rotation: [45, 10, -33].map(THREE.MathUtils.degToRad),
    scale: 0.50,
    color: '#fdff54',
    glowIntensity: 10,
    // visible is implicitly handled by animation now
};

// --- Bloom Animation Constants (moved here) ---
const TARGET_PLAYING_INTENSITY = 3;
const TARGET_PAUSED_INTENSITY = 0.5;
const INTENSITY_STEP = 0.05; // How much to change intensity per interval
const ANIMATION_INTERVAL_MS = 30; // Milliseconds between updates

// --- End Hardcoded Values ---

// --- Parent Canvas Setup --- 
const RecordAnimation = ({ 
  isPlaying, // Received from App.js, reflects the current playback state.
  audioRef, // Received from App.js, reference to the HTML <audio> element.
  // currentBpm: Received from App.js. This is the BPM of the *currently active track*,
  // determined by App.js based on activeAlbumTitle. It overrides the initial BPM in coverData
  // for effects like pulse rings in VinylRecord.
  currentBpm, 
  onFocusTargetChange, // Callback to App.js to report which element (if any) is focused.
  // onActiveAlbumChange: Callback to App.js. This component calls this function
  // with the *title* of the newly selected album cover when the user interacts with it.
  // This signals App.js to update its state (currentAudioSrc, currentBpm, etc.).
  onActiveAlbumChange, 
  albumTransitionState = 'idle', // Received from App.js (currently always 'idle'), potentially for visual transitions.
  frequencyData, // Received from App.js, contains analysed audio frequencies for visuals.
  analyserRef, // Audio analyser reference from App.js
  isMobile, // Received from App.js
  isClean, // <<< Add isClean to props destructuring
  isFullscreen, // <<< Add isFullscreen to props destructuring
}) => {
    // 1. Manage cover data in state
    // This state holds the current arrangement of cover metadata. It's initialized
    // with the constant `coverData` but can be updated (e.g., swapping cover positions).
    const [dynamicCoverData, setDynamicCoverData] = useState(coverData);
    // focusTarget tracks the currently focused element: null, 'vinyl', or the index of a focused cover.
    const [focusTarget, setFocusTarget] = useState(null); 
    // 2. State to hold the currently hovered mesh for outlining
    const [outlineSelection, setOutlineSelection] = useState([]);
    // 3. Ref array to hold refs for each AlbumCover mesh
    const coverRefs = useRef([]);
    // Track the active album index for BPM lookup
    const [activeAlbumIndex, setActiveAlbumIndex] = useState(2); // Default to index 2

    // --- Leva Controls for PigpenDust --- 
    // const dustControls = useControls('Pigpen Dust', {
    //     count: { value: 20, min: 1, max: 105, step: 1 },
    //     radius: { value: 2.2, min: 0.1, max: 10, step: 0.1 },
    //     dashRatio: { value: 0.72, min: 0, max: 0.99, step: 0.01 },
    //     dashArray: { value: 1.17, min: 0.01, max: 5.5, step: 0.01 },
    //     lineWidth: { value: 0.01, min: 0.01, max: 5.2, step: 0.005 },
    //     lineWidthVariance: { value: 0, min: 0, max: 5.1, step: 0.005 },
    //     speedFactor: { value: 1, min: 0.01, max: 6, step: 0.01 },
    //     dustBaseColor: { value: 'grey' },
    //     dustEmissiveColor: { value: 'white' },
    //     dustEmissiveIntensity: { value: 5, min: 0, max: 5, step: 0.1 },
    // });
    const dustControls = PIGPEN_DUST_CONFIG;
    // --- End Leva Controls ---

    // Leva Controls for main Bloom Effect
    // const bloomControls = useControls('Bloom Effect', {
    //     bloomLuminanceThreshold: { value: 0.9, min: 0, max: 1, step: 0.01 },
    //     bloomIntensity: { value: 1.5, min: 0, max: 10, step: 0.1 },
    //     // We can keep levels and mipmapBlur constant or add controls if needed
    //     // levels: { value: 6, min: 1, max: 16, step: 1 },
    //     // mipmapBlur: { value: true },
    // });
    const bloomControls = BLOOM_CONFIG;

    // Ensure the refs array has the correct number of elements
    if (coverRefs.current.length !== dynamicCoverData.length) {
        coverRefs.current = Array(dynamicCoverData.length).fill().map((_, i) => coverRefs.current[i] || React.createRef());
    }

    // Create the audioAnalyser object for AudioPlaneParticles
    const audioAnalyserPropForPlane = useMemo(() => ({
        update: () => {
            const currentRawData = frequencyData || new Uint8Array(analyserRef.current ? analyserRef.current.frequencyBinCount : 128).fill(0);
            let sum = 0;
            for (let i = 0; i < currentRawData.length; i++) {
                sum += currentRawData[i];
            }
            const avg = currentRawData.length > 0 ? sum / currentRawData.length : 0;
            return { data: currentRawData, avg: avg };
        },
        isPlaying: isPlaying
    }), [frequencyData, analyserRef, isPlaying]); // Add isPlaying to the dependency array

    // updateFocusTarget: Internal handler to set local focus state and call the prop.
    const updateFocusTarget = (newTarget) => {
      setFocusTarget(newTarget);
      if (onFocusTargetChange) {
        onFocusTargetChange(newTarget);
      }
    };

    // --- Background Opacity Animations (depend on focusTarget) --- 
    // Uses useSpring from @react-spring/web
    const backgroundFocusOpacitySpring = useSpring({
        opacity: focusTarget !== null ? 0 : 1, // Hide background if anything is focused
        config: { tension: 280, friction: 60 }
    });
    /* // Commented out old cycle springs
    const lightCycleOpacitySpring = useSpring({
        opacity: !isPlaying ? 1 : 0,
        config: { tension: 80, friction: 50 } 
    });
    const darkCycleOpacitySpring = useSpring({
        opacity: isPlaying ? 1 : 0,
        config: { tension: 80, friction: 50 }
    });
    */
    
    // Uses useSpring from @react-spring/web
    const { backgroundColor } = useSpring({
        to: { 
            backgroundColor: 
                focusTarget === 'vinyl' ? '#D3BDB0' : // Changed from '#CCCCCC'
                typeof focusTarget === 'number' ? 'gold' : // Gold for cover focus
                'rgba(0, 0, 0, 0)' // Transparent otherwise (match initial state)
        },
        config: { tension: 280, friction: 60 } // Same config as opacity spring
    });
    
    // 3. Update event handlers to use the new updateFocusTarget function
    const handleVinylDragStart = () => updateFocusTarget('vinyl');
    const handleVinylDragEnd = () => updateFocusTarget(null);
    
    // REVERTED: Updated pointer down handler for toggle logic
    const handleCoverPointerDown = (index) => { 
        if (typeof focusTarget === 'number') {
            // Pass the index of the cover just clicked for the toggle release
            handleCoverPointerUp(index); 
            return; 
        }
        updateFocusTarget(index);
    };
    
    // REVERTED: Updated pointer up handler to accept index
    // handleCoverPointerUp: Called when a cover click/interaction ends.
    // It determines which cover was released and triggers:
    // 1. Potential geometry swap in `dynamicCoverData` state if the released cover isn't the target.
    // 2. Calling `onActiveAlbumChange` prop with the title of the released cover,
    //    signalling App.js to change the audio track and associated state.
    // 3. Clearing the focus state.
    const handleCoverPointerUp = (index) => { // Accept index here
      // Use the passed index (from the event) to determine the active album
      const releasedCoverIndex = index; 
      // const releasedCoverIndex = focusTarget; // Remove this line

      if (typeof releasedCoverIndex === 'number') {
        const releasedCoverData = dynamicCoverData[releasedCoverIndex]; // Use the event index
        
        const targetIndex = 2; 
        
        // We only perform the geometry swap if the released index is different from target
        // AND if the focus was actually set (focusTarget !== null)
        // The second check prevents swapping geometry if the user just clicks without focusing first (though handleCoverPointerDown prevents this now)
        if (focusTarget !== null && releasedCoverIndex !== targetIndex) { 
          // Get the objects from the current state
          const coverToActivate = dynamicCoverData[releasedCoverIndex]; // Use event index
          const coverToDeactivate = dynamicCoverData[targetIndex]; // Cover currently at target

          // Get the ORIGINAL resting geometries from the initial constant
          const originalActivatedGeometry = {
            position: coverData[releasedCoverIndex].position, // Use event index
            rotationDeg: coverData[releasedCoverIndex].rotationDeg,
          };
          const originalDeactivatedGeometry = {
            position: coverData[targetIndex].position,
            rotationDeg: coverData[targetIndex].rotationDeg,
          };

          // Create a new array using map
          const newData = dynamicCoverData.map((cover, idx) => { // Renamed map index to 'idx'
            if (idx === releasedCoverIndex) { // Use event index
              // This slot gets the cover that WAS at targetIndex,
              // but with the geometry ORIGINALLY belonging to this slot.
              return { 
                ...coverToDeactivate, 
                position: originalActivatedGeometry.position, 
                rotationDeg: originalActivatedGeometry.rotationDeg,
              }; 
            } else if (idx === targetIndex) {
              // This slot gets the cover that was just activated,
              // but with the geometry ORIGINALLY belonging to the target slot.
              return { 
                ...coverToActivate, 
                position: originalDeactivatedGeometry.position, 
                rotationDeg: originalDeactivatedGeometry.rotationDeg,
               }; 
            } else {
              return cover; 
            }
          });
          
          setDynamicCoverData(newData);
        }

        // Call active album change callback (using data identified by event index)
        // This is the key communication point back to App.js to change the playing song.
        if (releasedCoverData && onActiveAlbumChange) {
          onActiveAlbumChange(releasedCoverData.title); // Pass the title up
          setActiveAlbumIndex(releasedCoverIndex); // Update local active index
        }
      }
      // Clear focus AFTER processing potential swap and active album change
      updateFocusTarget(null);
    };

    // --- Calculate derived state for children ---
    const isVinylFocused = focusTarget === 'vinyl';
    // 1. Calculate if any cover is focused
    const isCoverFocused = typeof focusTarget === 'number'; 

    // Calculate target position for the vinyl record
    const UNFOCUSED_VINYL_Y_OFFSET = 0.25; // Adjust this value for desired height
    const vinylTargetPosition =
        isCoverFocused
            ? [0, 0, VINYL_PUSHBACK_Z] // Move back if a cover is focused
            : isVinylFocused
                ? [0, VINYL_PUSHBACK_Y, 0] // Center position if vinyl itself is focused
                : [0, 0, UNFOCUSED_VINYL_Y_OFFSET]; // Raised position if nothing is focused
        
    // Pre-calculate focused rotation in radians
    const focusedRotationRad = [
      THREE.MathUtils.degToRad(FOCUSED_COVER_ROTATION_DEG[0]),
      THREE.MathUtils.degToRad(FOCUSED_COVER_ROTATION_DEG[1]),
      THREE.MathUtils.degToRad(FOCUSED_COVER_ROTATION_DEG[2]),
    ];
    // Pre-calculate backward tilt in radians
    const focusedBackwardTiltRad = THREE.MathUtils.degToRad(FOCUSED_BACKWARD_TILT_DEG);

    // 4. Hover handlers for individual AlbumCovers
    const handleCoverPointerOver = (e, index) => {
        e.stopPropagation();
        // Remove condition: Always outline on hover if ref exists
        if (coverRefs.current[index]?.current) {
            setOutlineSelection([coverRefs.current[index].current]);
        }
    };
    const handleCoverPointerOut = (e) => {
        e.stopPropagation();
        // Check if the pointer is *really* leaving the cover
        // (e.relatedTarget might be another part of the scene or UI)
        // For simplicity, we clear if the selection isn't empty.
        // More robust checks might be needed depending on scene complexity.
        if (outlineSelection.length > 0) {
             setOutlineSelection([]);
        }
    };

    // --- Spring for Neon Sign Animation --- 
    // Uses useSpringThree from @react-spring/three
    const neonSpringProps = useSpringThree({
      opacity: isPlaying ? 1 : 0, // Keep opacity animation if desired
      scale: isPlaying ? NEON_SIGN_PROPS.scale : 0, // Use constant
      positionZ: isPlaying ? NEON_SIGN_PROPS.position[2] : -1.5, // Use constant
      config: isPlaying ? config.wobbly : config.stiff,
      delay: 1500
    });

    // Add state for bloom intensity (constants are now defined outside)
    const [currentBloomIntensity, setCurrentBloomIntensity] = useState(
        isPlaying ? TARGET_PLAYING_INTENSITY : TARGET_PAUSED_INTENSITY
    );
    // Ref to store the interval ID
    const intensityIntervalRef = useRef(null);

    // Effect to animate bloom intensity using setInterval (constants are now defined outside)
    useEffect(() => {
        const targetIntensity = isPlaying ? TARGET_PLAYING_INTENSITY : TARGET_PAUSED_INTENSITY;

        // Clear any existing interval first
        if (intensityIntervalRef.current) {
            clearInterval(intensityIntervalRef.current);
            intensityIntervalRef.current = null;
        }

        // Start new interval if not already at target
        if (currentBloomIntensity !== targetIntensity) {
            intensityIntervalRef.current = setInterval(() => {
                setCurrentBloomIntensity(prevIntensity => {
                    let nextIntensity;
                    if (prevIntensity < targetIntensity) {
                        nextIntensity = Math.min(targetIntensity, prevIntensity + INTENSITY_STEP);
                    } else {
                        nextIntensity = Math.max(targetIntensity, prevIntensity - INTENSITY_STEP);
                    }

                    // If target reached, clear interval inside the setter logic
                    if (nextIntensity === targetIntensity) {
                        if (intensityIntervalRef.current) {
                            clearInterval(intensityIntervalRef.current);
                            intensityIntervalRef.current = null;
                        }
                    }
                    return nextIntensity;
                });
            }, ANIMATION_INTERVAL_MS);
        }

        // Cleanup function to clear interval on unmount or when isPlaying changes
        return () => {
            if (intensityIntervalRef.current) {
                clearInterval(intensityIntervalRef.current);
                intensityIntervalRef.current = null;
            }
        };
    // Ensure dependencies are correct: run when isPlaying changes or component mounts/unmounts
    }, [isPlaying]); // Depend only on isPlaying 

    return (
        <>
            {/* Visually hidden images for SEO */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
              {coverData.map((cover, index) => (
                <img 
                  key={`seo-img-${index}`}
                  src={cover.imageUrl}
                  alt={`Album art for ${cover.albumName} by ${cover.artistName} - example of a record we clean or digitize in Minnesota.`}
                />
              ))}
            </div>

            {/* Hide the Leva panel by setting hidden={true} */}
            <Leva hidden />
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Updated background styles */}
                {/* 
                 <animated.div 
                     className="teal-cycle-background" 
                     style={{
                         // Use backgroundFocusOpacitySpring ONLY, remove lightCycle logic
                         opacity: backgroundFocusOpacitySpring.opacity,
                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                         zIndex: -1
                     }}
                 />
                 */}
                 <animated.div 
                     className={isClean ? "dark-teal-cycle-background" : "brown-cycle-background"} 
                     style={{
                         // Use backgroundFocusOpacitySpring ONLY, remove darkCycle logic
                         opacity: backgroundFocusOpacitySpring.opacity, 
                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                         zIndex: -0.9 // Keep dark teal potentially visible behind focus overlay
                     }}
                 />
                 <animated.div
                     style={{ 
                         backgroundColor: backgroundColor,
                         position: 'absolute',
                         top: 0,
                         left: 0,
                         width: '100%',
                         height: '100%',
                         zIndex: -0.5 
                     }}
                 />
                
                <Canvas
                    style={{
                        touchAction: 'none', // Prevent default touch actions
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1
                     }}
                    // camera={{ position: [1.28, -3.2, 1.6] }} // REMOVED - Handled by AnimatedCamera
                    gl={{ alpha: true }} // Make canvas transparent
                    shadows // Enable shadows in the renderer
                >
                    {/* Pass focusTarget and isMobile to camera */}
                    <AnimatedCamera 
                        focusTarget={focusTarget} 
                        isMobile={isMobile} 
                        isFullscreen={isFullscreen}
                    />

                     <EffectComposer multisampling={4} autoClear={false}>
                         {/* Scene Content */}
                         <ambientLight intensity={0.8} />
                         <pointLight position={[5, 10, 5]} intensity={1.0} castShadow />
                         
                         {/* Use hardcoded values for directional light */}
                         <directionalLight 
                             position={LIGHT_POSITION}
                             rotation={LIGHT_ROTATION} // Note: Rotation on lights might behave unexpectedly, often position and target are preferred
                             intensity={LIGHT_INTENSITY} 
                             castShadow={LIGHT_CAST_SHADOW}
                             shadow-bias={LIGHT_SHADOW_BIAS}
                             shadow-radius={LIGHT_SHADOW_RADIUS}
                             // Reduce shadow map resolution
                             shadow-mapSize-width={512} 
                             shadow-mapSize-height={512}
                             shadow-camera-far={40} 
                             shadow-camera-left={-10} 
                             shadow-camera-right={10} 
                             shadow-camera-top={10} 
                             shadow-camera-bottom={-10}
                             shadow-normalBias={SHADOW_NORMAL_BIAS}
                         />
                         
                         {/* Use hardcoded values for shadow-receiving plane */}
                         <group position={PLANE_POSITION} rotation={PLANE_ROTATION}>
                             {/* Main shadow-receiving plane */}
                             <mesh receiveShadow>
                                 <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
                                 <meshStandardMaterial 
                                     color={PLANE_COLOR}
                                     transparent
                                     opacity={PLANE_OPACITY}
                                     side={THREE.DoubleSide}
                                     metalness={0}
                                     roughness={1}
                                     depthWrite={false}
                                     shadowSide={THREE.FrontSide}
                                 />
                             </mesh>
                             
                             {/* Alternative shadow-only plane approach */}
                             <mesh receiveShadow>
                                 <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
                                 <shadowMaterial 
                                     transparent
                                     opacity={PLANE_SHADOW_OPACITY} 
                                     side={THREE.DoubleSide}
                                     depthWrite={false}
                                 />
                             </mesh>
                         </group>
                         
                         <React.Suspense fallback={null}>
                              <group> 
                                  {/* 2. Map over dynamicCoverData from state */} 
                                  {dynamicCoverData.map((cover, index) => {
                                      // Calculate Target Position & Rotation (Uses updated constants)
                                      
                                      // Default resting position/rotation comes from dynamic state data
                                      let restingPosition = cover.position; 
                                      let restingRotationDeg = cover.rotationDeg;

                                      let targetPosition = restingPosition; // Start with resting state
                                      let targetRotationRad = [
                                          THREE.MathUtils.degToRad(restingRotationDeg[0]),
                                          THREE.MathUtils.degToRad(restingRotationDeg[1]),
                                          THREE.MathUtils.degToRad(restingRotationDeg[2]),
                                      ];
                                      
                                      // Calculate Target Scale
                                      let targetScaleValue = BASE_COVER_SCALE;
                                      if (typeof focusTarget === 'number') { // If *any* cover is focused
                                          targetScaleValue = FOCUSED_COVER_SCALE;
                                      }
                                      const targetScaleArray = [targetScaleValue, targetScaleValue, targetScaleValue];
                                      
                                      const isCurrentlyFocused = index === focusTarget;
                                      const isAnotherFocused = typeof focusTarget === 'number' && !isCurrentlyFocused;
                                      
                                      if (isCurrentlyFocused) {
                                          // Apply Y and Z offset to the focused cover's position
                                          targetPosition = [
                                            FOCUSED_COVER_POSITION[0],
                                            FOCUSED_COVER_POSITION[1] + ACTIVE_COVER_Y_OFFSET, // Add Y offset
                                            FOCUSED_COVER_POSITION[2] + ACTIVE_COVER_Z_OFFSET // Add Z offset
                                          ];
                                          targetRotationRad = focusedRotationRad;
                                          // Apply base rotation AND backward tilt to focused cover
                                          targetRotationRad = [
                                            focusedRotationRad[0] + focusedBackwardTiltRad,
                                            focusedRotationRad[1],
                                            focusedRotationRad[2]
                                          ];
                                          // Target scale already calculated before this block
                                          
                                      } else if (isAnotherFocused) {
                                          // Keep original direction for reference if needed elsewhere, but redefine for rotation
                                          // const direction = index < focusTarget ? -1 : 1; 
                                          // Order for Z stacking (Not needed for X spacing)
                                          // const posXOrder = Math.abs(index - focusTarget); 
                                          
                                          // --- Calculate Rotation & Position based on Visual Fan Position (Horizontal) --- 
                                          const numCovers = coverData.length;
                                          // 0 = focused, 1 = next, N-1 = prev
                                          const relativeIndex = (index - focusTarget + numCovers) % numCovers; 
                                          
                                          let rotOrder = 0;
                                          let posDirection = 1; // Direction for X position offset
                                          let rotDirection = 1; // Direction for Y rotation offset (flipped)
                                          
                                          if (relativeIndex <= numCovers / 2) {
                                              // Covers visually to the right of the focused one
                                              rotOrder = relativeIndex;
                                              posDirection = 1; // Move right
                                              rotDirection = -1; // Rotate INWARD (negative Y)
                                          } else {
                                              // Covers visually to the left (wrapping around)
                                              rotOrder = numCovers - relativeIndex;
                                              posDirection = -1; // Move left
                                              rotDirection = 1; // Rotate INWARD (positive Y)
                                          }
                                          // Calculate the Y rotation angle based on visual fan position & FLIPPED direction
                                          const rotationYOffsetRad = THREE.MathUtils.degToRad(rotDirection * UNFOCUSED_ROTATION_Y_DEG * rotOrder);
                                          
                                          // Calculate target position: Offset X using posDirection, keep Y/Z relative to INACTIVE_COVER_BASE_Z
                                          targetPosition = [
                                              FOCUSED_COVER_POSITION[0] + posDirection * UNFOCUSED_SPACING_X * rotOrder,
                                              FOCUSED_COVER_POSITION[1], // Keep Y same as base focused cover
                                              INACTIVE_COVER_BASE_Z // Use the defined base Z for inactive
                                          ];
                                          
                                          // Calculate target rotation (applying Y fan rotation AND backward X tilt)
                                          targetRotationRad = [
                                              focusedRotationRad[0] + focusedBackwardTiltRad, // Apply backward tilt
                                              focusedRotationRad[1] + rotationYOffsetRad, // Apply Y fan rotation
                                              focusedRotationRad[2] // Keep Z rot same as focused
                                          ];
                                          // Target scale already calculated before this block
                                      }
                                      
                                      return (
                                          <AlbumCover 
                                              ref={coverRefs.current[index]} // 6. Assign ref
                                              key={cover.title || index}
                                              imageUrl={cover.imageUrl}
                                              targetPosition={targetPosition}
                                              targetRotationRad={targetRotationRad}
                                              targetScale={targetScaleArray}
                                              isVinylFocused={isVinylFocused}
                                              // Focus handlers
                                              onPointerDown={(e) => { e.stopPropagation(); handleCoverPointerDown(index); }}
                                              // Pass index to pointer up handler
                                              onPointerUp={(e) => { e.stopPropagation(); handleCoverPointerUp(index); }}
                                              // Outline Hover handlers
                                              onPointerOver={(e) => handleCoverPointerOver(e, index)}
                                              onPointerOut={handleCoverPointerOut}
                                          />
                                      );
                                  })}
                              </group>
                         
                              <VinylRecord 
                                  isPlaying={isPlaying} 
                                  audioRef={audioRef} // Pass down audioRef for time/state access
                                  currentBpm={currentBpm} // Use the BPM prop passed down from App.js
                                  // Pass original handlers
                                  onDragStart={handleVinylDragStart}
                                  onDragEnd={handleVinylDragEnd}
                                  vinylTargetPosition={vinylTargetPosition}
                                  isVinylFocused={isVinylFocused} // Pass vinyl focus state
                                  // 2. Pass down the cover focus state
                                  isCoverFocused={isCoverFocused}
                                  // Pass transition state to control animations
                                  albumTransitionState="idle" // Always use 'idle' state
                                  // Explicitly turn off shadows for vinyl record
                                  castShadow={false}
                                  analyserRef={analyserRef} // Pass the analyser node ref
                                  frequencyData={frequencyData} // Pass frequency data
                                  isClean={isClean} // <<< Add this line to pass isClean
                              />

                               {/* Conditionally render SpiderWeb based on isPlaying, passing BPM and frequency data */}
                               {/* Render the first Bubble using hardcoded props */}
                               <Bubble 
                                 {...BUBBLE1_PROPS} 
                                 isDirty={!isClean} 
                                 dirtyPopDelay={0 * 500} // 0ms delay for first bubble pop
                                 cleanReturnDelay={2000 + (0 * 500)} // 2000ms base + 0ms stagger for first return
                               />
                               {/* Render the second Bubble using hardcoded props */}
                               <Bubble 
                                 {...BUBBLE2_PROPS} 
                                 isDirty={!isClean} 
                                 dirtyPopDelay={1 * 500} // 500ms pop delay
                                 cleanReturnDelay={2000 + (1 * 500)} // 2000ms base + 500ms stagger for return
                               />
                               {/* Render the third Bubble using hardcoded props */}
                               <Bubble 
                                 {...BUBBLE3_PROPS} 
                                 isDirty={!isClean} 
                                 dirtyPopDelay={2 * 500} // 1000ms pop delay
                                 cleanReturnDelay={2000 + (2 * 500)} // 2000ms base + 1000ms stagger for return
                               />
                               {/* Render the fourth Bubble using constant props */} 
                               <Bubble 
                                 {...BUBBLE4_PROPS} 
                                 isDirty={!isClean} 
                                 dirtyPopDelay={3 * 500} // 1500ms pop delay
                                 cleanReturnDelay={2000 + (3 * 500)} // 2000ms base + 1500ms stagger for return
                               /> 

                               {/* Use animatedThree for the R3F element */} 
                               <animatedThree.group
                                   // Use constant X, Y
                                   position-x={NEON_SIGN_PROPS.position[0]}
                                   position-y={NEON_SIGN_PROPS.position[1]}
                                   // Animate Z position from spring
                                   position-z={neonSpringProps.positionZ}
                                   // Animate scale uniformly from spring
                                   scale={neonSpringProps.scale}
                                   // Use constant rotation
                                   rotation={NEON_SIGN_PROPS.rotation}
                                   // Animate opacity on the group if needed
                                   // opacity={neonSpringProps.opacity} // This won't directly work on group, needs material change
                               >
                                   {/* Apply opacity directly to NeonSign material if needed, or handle visibility via scale */}
                                   <NeonSign
                                       color={NEON_SIGN_PROPS.color}
                                       glowIntensity={NEON_SIGN_PROPS.glowIntensity}
                                       // Consider passing opacity if NeonSign supports it
                                       // opacity={neonSpringProps.opacity} 
                                   />
                               </animatedThree.group>

                                {/* --- Pigpen Dust Effect (Commented Out) --- */}
                                {/* 
                                <PigpenDust 
                                    position={[0, 0, 0]} 
                                    {...dustControls} 
                                    count={Math.floor(dustControls.count * 0.8)} 
                                    radius={dustControls.radius * (1.1 + (Math.random() - 0.5) * 0.2)} // +/- 10% randomness
                                    dashArray={dustControls.dashArray * (1 + (Math.random() - 0.5) * 0.3)} // +/- 15% randomness
                                    speedFactor={dustControls.speedFactor * 0.75} 
                                    // Pass emissive props
                                    emissive={dustControls.dustEmissiveColor}
                                    emissiveIntensity={dustControls.dustEmissiveIntensity}
                                    // Pass base color prop
                                    baseColor={dustControls.dustBaseColor}
                                />
                                */}
                                {/* --- End Pigpen Dust --- */}

                                {/* Render PigpenDust conditionally */}
                             
                                {/* Render SpiderWeb conditionally - COMMENTED OUT */}
                                {/* {!isClean && isPlaying && (
                                  <SpiderWeb 
                                    bpm={currentBpm} 
                                    freqData={frequencyData} 
                                  />
                                )} */}

                                {/* Render InstancedParticles (updated to use new component and pass isClean) */}
                                {/* <InstancedParticles 
                                    count={750} // Or use a Leva control if preferred
                                    analyserRef={analyserRef}
                                    frequencyData={frequencyData}
                                    isClean={isClean} // Pass isClean state
                                    isPlaying={isPlaying} // <<< ADD isPlaying PROP
                                /> */}
                                
                                {/* Render new AudioPlaneParticles */}
                                <AudioPlaneParticles audioAnalyser={audioAnalyserPropForPlane} />
                         </React.Suspense>
                         {/* End Scene Content */}

                         {/* Post-processing Effects */}
                         {(() => { // IIFE to calculate colors conditionally
                            const isCoverFocus = typeof focusTarget === 'number';
                            const visibleColor = isCoverFocus ? 'teal' : 'gold';
                            const hiddenColor = isCoverFocus ? 'gold' : 'teal';
                            
                            return (
                              <Outline 
                                selection={outlineSelection}
                                visibleEdgeColor={visibleColor} // Use calculated color
                                hiddenEdgeColor={hiddenColor}   // Use calculated color
                                edgeStrength={50}
                                pulseSpeed={0.8}
                                pulseStrength={1} // Adjust pulseStrength as needed (optional)
                                xRay={false} // Keep xRay false if you don't want outlines through objects
                              />
                            );
                         })()}
                         
                         {/* Use the state variable for intensity AND controls for threshold */}
                         <Bloom 
                             luminanceThreshold={bloomControls.bloomLuminanceThreshold} 
                             intensity={bloomControls.bloomIntensity} // Use controlled intensity directly for now
                             levels={6} // Keep constant levels for now
                             mipmapBlur={true} // Keep mipmapBlur constant
                         />

                     </EffectComposer>
            </Canvas>
            </div>
        </>
    );
};

export default RecordAnimation;