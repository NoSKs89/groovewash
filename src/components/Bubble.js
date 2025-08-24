import React, { useState, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { CubeCamera, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three'; // Import THREE
import { useSpring, animated, config, useSpringRef, useChain, interpolate } from '@react-spring/three'; // Import react-spring hooks and interpolate

// Create animated versions of components
const AnimatedMesh = animated.mesh;
const AnimatedGroup = animated.group; // Add animated group
const AnimatedMeshDistortMaterial = animated(MeshDistortMaterial);

// Reusable vector for calculations
const vec = new THREE.Vector3();

// Modified Bubble component to use CubeCamera and pop animation
const Bubble = React.memo(function Bubble(props) {
    const { scene } = useThree();
    const [isPopped, setIsPopped] = useState(false);
    const [isHovered, setIsHovered] = useState(false); // Add hover state
    const [targetHoverOffset, setTargetHoverOffset] = useState([0, 0, 0]); // State for target offset
    const cubeCameraResolution = 256;
    const reverseTimeoutRef = useRef(null); // Ref to store timeout ID
    const dirtyPopTimeoutRef = useRef(null); // Ref for dirty pop delay
    const cleanReturnTimeoutRef = useRef(null); // Ref for clean return delay

    // Extract material props and meshProps
    const {
        distort: baseDistort = 0.25, // Rename prop to baseDistort
        transmission = 1.05,
        thickness = -0.5,
        roughness = 0,
        iridescence = 1,
        iridescenceIOR = 1,
        iridescenceThicknessRange = [0, 1200],
        clearcoat = 1,
        clearcoatRoughness = 0,
        envMapIntensity = 1.5,
        floatIntensity = 1.5,
        floatSpeed = 0.5,
        initialScale = 1,
        position: initialPosition = [0, 0, 0], // Extract initial position
        isDirty = false, // New prop
        dirtyPopDelay = 0, // New prop for staggered pop
        cleanReturnDelay = 0, // New prop for staggered return
        ...otherMeshProps // Remaining props (like rotation)
    } = props;

    // Calculate a randomized initial distort value ONCE on mount
    const [randomizedInitialDistort] = useState(() => {
        const variation = 0.5; // +/- 25% variation
        return baseDistort * (1 + (Math.random() - 0.5) * variation);
    });

    // Ensure initial values are arrays
    const baseScale = Array.isArray(initialScale) ? initialScale : [initialScale, initialScale, initialScale];
    const basePosition = Array.isArray(initialPosition) ? initialPosition : [0, 0, 0];
    // Calculate the target position for the pop (Z pushed forward)
    const poppedPosition = [basePosition[0], basePosition[1], basePosition[2] + 0.85];

    // --- Animation Setup ---
    // Refs for pop animation chain
    const popPropertiesRef = useSpringRef();
    const popPositionRef = useSpringRef();
    const popScaleOpacityRef = useSpringRef(); // Renamed from popSpringRef

    // Spring for pop properties (distort, transmission)
    const { animDistort, animTransmission } = useSpring({
        ref: popPropertiesRef,
        from: { 
            animDistort: randomizedInitialDistort, 
            animTransmission: transmission,
        },
        to: {
            animDistort: isPopped ? 2 : randomizedInitialDistort,
            animTransmission: isPopped ? 1.875 : transmission,
        },
        config:  config.stiff, 
    });

    // Spring for pop position
    const { animPosition } = useSpring({
        ref: popPositionRef,
        from: { animPosition: basePosition },
        to: { animPosition: isPopped ? poppedPosition : basePosition },
        config: config.stiff,
    });

    // Spring for pop scale and opacity
    const { animScale, animOpacity } = useSpring({
        ref: popScaleOpacityRef, // Use renamed ref
        from: { animScale: baseScale, animOpacity: 1 },
        to: {
            animScale: isPopped ? [0, 0, 0] : baseScale,
            animOpacity: isPopped ? 0 : 1,
        },
        config: config.wobbly, 
        onRest: (result) => {
            // Only unpop if the pop was finished, the bubble is meant to be popped, AND isDirty is false.
            if (isPopped && result.finished && !isDirty) { 
                console.log("Pop animation finished (not dirty). Starting 5s timer to reverse...");
                clearTimeout(reverseTimeoutRef.current);
                reverseTimeoutRef.current = setTimeout(() => {
                    console.log("5s passed. Reversing pop animation.");
                    setIsPopped(false); // Trigger the reverse animation
                }, 5000); // 5 seconds delay
            } else if (isPopped && result.finished && isDirty) {
                console.log("Pop animation finished (isDirty is true). Bubble stays popped.");
                clearTimeout(reverseTimeoutRef.current); // Ensure no reversal while dirty
            }
        },
    });

    // Spring for hover effects (offset position, added distortion)
    const { hoverOffset, hoverDistort } = useSpring({
        to: {
            hoverOffset: isHovered ? targetHoverOffset : [0, 0, 0],
            hoverDistort: isHovered ? 0.2 : 0 // Add distortion back
        },
        config: isHovered ? config.wobbly : config.molasses 
    });

    // Update pop animation chain
    useChain(
        isPopped 
            ? [popPropertiesRef, popPositionRef, popScaleOpacityRef] 
            : [popScaleOpacityRef, popPositionRef, popPropertiesRef],
        isPopped ? [0, 0.05, 0.1] : [0, 0, 0] // Adjust timing if needed
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            clearTimeout(reverseTimeoutRef.current);
            clearTimeout(dirtyPopTimeoutRef.current);
            clearTimeout(cleanReturnTimeoutRef.current); // Clear clean return timeout
        };
    }, []);

    // Effect to handle isDirty changes
    useEffect(() => {
        clearTimeout(dirtyPopTimeoutRef.current); 
        clearTimeout(cleanReturnTimeoutRef.current); // Clear any pending return from previous state

        if (isDirty) {
            if (!isPopped) {
                console.log(`Bubble dirty, will pop in ${dirtyPopDelay}ms`);
                dirtyPopTimeoutRef.current = setTimeout(() => {
                    if (!isPopped) {
                        setIsPopped(true);
                        clearTimeout(reverseTimeoutRef.current); 
                        console.log("Bubble popped due to isDirty.");
                    }
                }, dirtyPopDelay);
            } else {
                 // If already popped when isDirty becomes true, ensure reversal timer is cancelled
                 clearTimeout(reverseTimeoutRef.current);
            }
        } else {
            // isDirty is false (i.e., isClean is true)
            if (isPopped) { // If the bubble is currently popped
                console.log(`Bubble clean, was popped, will return in ${cleanReturnDelay}ms`);
                cleanReturnTimeoutRef.current = setTimeout(() => {
                    // We only setIsPopped(false) if it's still popped at the moment the timeout fires.
                    // This handles cases where it might have been re-popped by a click, for instance.
                    // However, for a clean return, we generally want to force it back.
                    setIsPopped(false); 
                    console.log("Bubble returned due to isClean.");
                    // Do NOT restart the 5s reverseTimeoutRef here, as this is an explicit return to clean state.
                }, cleanReturnDelay);
            }
        }
    }, [isDirty, isPopped, dirtyPopDelay, cleanReturnDelay]);

    const handleClick = (event) => {
        event.stopPropagation();
        if (!isPopped) {
            clearTimeout(reverseTimeoutRef.current);
            clearTimeout(dirtyPopTimeoutRef.current); 
            clearTimeout(cleanReturnTimeoutRef.current); // If clicked while a clean return is pending, cancel the return and pop it
            setIsPopped(true);
            console.log("Bubble popping sequence started (click)!");
            // The onRest logic will determine if it unpops based on isDirty state (and only if not dirty)
        } else if (isPopped && !isDirty) {
            // If clicked while popped AND NOT dirty, allow it to manually unpop (start its 5s timer)
            // This case is mostly for when a bubble was returned by isClean, and user clicks it again.
            // Or if it was clicked, popped, and isClean is true.
            clearTimeout(reverseTimeoutRef.current); // Clear any existing, just in case
            reverseTimeoutRef.current = setTimeout(() => {
                setIsPopped(false); 
                console.log("5s passed after click on popped (clean) bubble. Reversing pop animation.");
            }, 5000);
        }
    };

    // --- Hover Handlers ---
    const handlePointerOver = (e) => {
        e.stopPropagation();
        if (e.point) {
            const localPoint = e.point;
            vec.copy(localPoint).normalize().negate().multiplyScalar(0.15); // Calculate offset
            setTargetHoverOffset(vec.toArray()); // Set target for the spring
        } else {
            console.warn("Hover event missing point.");
            setTargetHoverOffset([0.05, 0.05, 0.05]); // Fallback offset
        }
        setIsHovered(true); // Trigger hover spring
    };
    const handlePointerOut = (e) => {
        e.stopPropagation();
        setIsHovered(false); // Trigger slow return spring
        // No need to set targetHoverOffset back to 0 here, spring handles it
    };

    return (
        <CubeCamera resolution={cubeCameraResolution} frames={isPopped ? 1 : Infinity} args={[0.1, 1000, cubeCameraResolution]} scene={scene}>
             {(texture) => (
                 <Float floatIntensity={floatIntensity} speed={floatSpeed}>
                     {/* Outer group for hover position offset */}
                     <AnimatedGroup position={hoverOffset}>
                         <AnimatedMesh 
                             {...otherMeshProps} 
                             position={animPosition} // Base position from pop spring
                             scale={animScale} // Pop scale
                             castShadow={false}
                             onClick={handleClick}
                             onPointerOver={handlePointerOver}
                             onPointerOut={handlePointerOut}
                         >
                             <sphereGeometry args={[1, 32, 32]} />
                             <AnimatedMeshDistortMaterial
                                 // Use imported interpolate function
                                 distort={interpolate(
                                     [animDistort, hoverDistort],
                                     (popD, hoverD) => popD + hoverD
                                 )} 
                                 transmission={animTransmission} 
                                 thickness={thickness}
                                 roughness={roughness}
                                 iridescence={iridescence}
                                 iridescenceIOR={iridescenceIOR}
                                 iridescenceThicknessRange={iridescenceThicknessRange}
                                 clearcoat={clearcoat}
                                 clearcoatRoughness={clearcoatRoughness}
                                 envMapIntensity={envMapIntensity}
                                 envMap={texture}
                                 transparent={true}
                                 opacity={animOpacity} 
                             />
                         </AnimatedMesh>
                     </AnimatedGroup> { /* Close AnimatedGroup */ }
                 </Float>
             )}
         </CubeCamera>
     );
});

export default Bubble; 