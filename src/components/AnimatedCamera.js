import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Define positions/targets outside component if static
const initialPosition = new THREE.Vector3(1.28, -3.2, 1.6);
// Define the single "focused" camera position for both vinyl and covers
const focusedCameraPosition = new THREE.Vector3(0, 1.5, 3.5); // Adjust Y/Z for good view of origin
const defaultLookAt = new THREE.Vector3(0, 0, 0);
// Define the target look-at point when focused (where the covers animate to)
const focusLookAtTarget = new THREE.Vector3(0, 0, 0.1);

// --- Camera Rig Configuration ---
const RIG_RADIUS = 3; // Maximum distance the camera will move from its base position
const RIG_LERP_FACTOR = 0.15; // How smoothly the camera moves (lower = smoother)

// Wrap the component function definition with React.memo
const AnimatedCamera = React.memo(({ focusTarget, isMobile, isFullscreen }) => {
    const cameraRef = useRef();
    const { size } = useThree();
    const initialCanvasHeightRef = useRef(0);
    
    // Ref to smoothly interpolate the lookAt target
    const currentLookAtRef = useRef(defaultLookAt.clone());

    // Ref to store the base position for the rig effect
    const basePositionRef = useRef(initialPosition.clone());

    const prevFocusTargetRef = useRef(focusTarget); // To track when focus is lost

    useEffect(() => {
        // Capture initial canvas height only once on mount
        if (size.height > 0 && initialCanvasHeightRef.current === 0) {
            initialCanvasHeightRef.current = size.height;
            console.log('AnimatedCamera: Initial canvas height captured:', initialCanvasHeightRef.current);
        }
    }, [size.height]);

    // Update prevFocusTargetRef after each render, so it holds the value from the previous frame for the next frame's logic
    useEffect(() => {
        prevFocusTargetRef.current = focusTarget;
    });

    useFrame((state, delta) => {
        if (!cameraRef.current) return;

        const justLostFocus = prevFocusTargetRef.current !== null && focusTarget === null;

        let currentTargetPosition = initialPosition; // Base target position
        let currentTargetLookAt = defaultLookAt;   // Base lookAt

        if (focusTarget !== null) { // If something is focused
            currentTargetPosition = focusedCameraPosition;
            currentTargetLookAt = focusLookAtTarget;
            basePositionRef.current.copy(currentTargetPosition); // Rig's base will be the focus point if it were to activate from here
        } else { // Nothing is focused
            // currentTargetPosition remains initialPosition
            // currentTargetLookAt remains defaultLookAt
            basePositionRef.current.copy(initialPosition); // Rig's base is the initial camera position
        }

        // This variable will be the target for the position lerp in the non-rig (standard) path
        let nonRigFinalTargetPosition = currentTargetPosition.clone();
        const mobilePullbackAmount = 0.4; // How many world units to pull back on mobile

        if (isMobile) {
            const cameraDirection = new THREE.Vector3();
            // Ensure camera's matrixWorld is up-to-date before calling getWorldDirection
            // This is important if the camera itself is moving or its parent is.
            cameraRef.current.updateMatrixWorld(true); 
            cameraRef.current.getWorldDirection(cameraDirection);
            const offsetVector = cameraDirection.negate().multiplyScalar(mobilePullbackAmount);
            nonRigFinalTargetPosition.add(offsetVector);
            nonRigFinalTargetPosition.y -= 0.2; // specific mobile Y adjustment
        }
        
        // This temporary variable is for the rig's calculated target position
        let rigCalculatedTargetPosition = new THREE.Vector3(); 
        
        if (isFullscreen && focusTarget === null) {
            // --- Camera Rig Effect is active ---
            const pointerX = state.pointer.x; // -1 to 1
            const pointerY = state.pointer.y; // -1 to 1
            
            const rigOffsetX = Math.sin(pointerX) * RIG_RADIUS * 0.5;
            const rigOffsetY = Math.atan(pointerY) * RIG_RADIUS * 0.5; // Reduced Y motion
            const rigOffsetZ = Math.cos(pointerX) * RIG_RADIUS * 0.5;
            
            // Calculate the rig's target position based on its current base (which is initialPosition here)
            rigCalculatedTargetPosition.set(
                basePositionRef.current.x + rigOffsetX,
                basePositionRef.current.y + rigOffsetY,
                basePositionRef.current.z + rigOffsetZ
            );
            
            // If focus was just lost, return quickly to the rig's area. Otherwise, use normal rig smoothing.
            const positionLerpSpeed = justLostFocus ? delta * 4 : delta * RIG_LERP_FACTOR;
            cameraRef.current.position.lerp(rigCalculatedTargetPosition, positionLerpSpeed);
            
            // Rig always looks at the default lookAt point
            currentLookAtRef.current.lerp(defaultLookAt, delta * 4);
            cameraRef.current.lookAt(currentLookAtRef.current);
        } else {
            // --- Standard Camera Behavior (not in rig mode, or focusTarget is active) ---
            // Lerp to the target position (which includes mobile adjustments if any)
            cameraRef.current.position.lerp(nonRigFinalTargetPosition, delta * 4);
            
            // Lerp to the appropriate lookAt target (either default or focus-specific)
            currentLookAtRef.current.lerp(currentTargetLookAt, delta * 4); 
            cameraRef.current.lookAt(currentLookAtRef.current);
        }

        // --- Fullscreen Zoom Logic ---
        let targetZoom = 1;
        if (isFullscreen && initialCanvasHeightRef.current > 0 && size.height > 0) {
            targetZoom = initialCanvasHeightRef.current / size.height;
        }
        // Smoothly lerp zoom or apply directly
        cameraRef.current.zoom = THREE.MathUtils.lerp(cameraRef.current.zoom, targetZoom, delta * 5); // Lerp for smoothness

        cameraRef.current.updateMatrixWorld();
        cameraRef.current.updateProjectionMatrix();
    });

    return (
        <PerspectiveCamera 
            ref={cameraRef} 
            makeDefault
            aspect={size.width / size.height}
            fov={50}
            position={initialPosition}
        />
    );
});

export default AnimatedCamera; 