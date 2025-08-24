// src/components/LogoParticles.js
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { Points, useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { imageToParticleData } from '../utils/imageToParticles';
import GrooveWashLogoSrc from '../images/GrooveWash.svg'; // Import the logo SVG URL

const particleTextureUrl = "https://cdn.rawgit.com/akella/dots-animation/b9abad87/img/particle.png";

const glslSimplexNoise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

const ParticleShaderMaterial = shaderMaterial(
  {
    // Original Uniforms (ensure these are all present and correct)
    uParticleTexture: null,
    uTopDotSize: 20.0,
    uBottomDotSize: 40.0,
    uMinY: 0.0,
    uYSpan: 1.0, // This is crucial for original point size calculation
    uTime: 0.0,
    uNoiseScale: 0.1,
    uNoiseSpeed: 0.1,
    uDisplacementStrength: 10.0,
    uMouse: new THREE.Vector3(10000, 10000, 0),
    uInteractionRadius: 50.0,
    uPushStrength: 0.0,
    uBubbleStrength: 0.0,

    // New Visualizer Uniforms
    uIsPlayingVisualizer: 0.0, // 0.0 = logo, 1.0 = visualizer
    uTransitionProgress: 0.0, // 0.0 = fully logo, 1.0 = fully visualizer line
    uFrequencyTexture: new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType), // Default 1x1 texture
    uVisualizerHeightScale: 50.0,
    uVisualizerBaselineY: -50.0,
    uVisualizerWidth: 200.0,
    uVisualizerOverallScale: 1.0,
    uVisualizerColor: new THREE.Color(0, 1, 1),
  },
  // Vertex Shader
  `
    ${glslSimplexNoise}

    attribute vec3 color; // Standard attribute from original
    attribute float particleUCoord; // NEW: Normalized X-coordinate [0,1] for this particle within the logo's width

    varying vec3 vColor;
    varying float vNoiseVal; // Original varying for noise-based color effects

    // Original Uniforms
    uniform float uMinY;
    uniform float uYSpan;
    uniform float uTopDotSize;
    uniform float uBottomDotSize;
    uniform float uTime;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed;
    uniform float uDisplacementStrength;
    uniform vec3 uMouse;
    uniform float uInteractionRadius;
    uniform float uPushStrength;
    uniform float uBubbleStrength;

    // New Visualizer Uniforms
    uniform float uIsPlayingVisualizer; // If visualizer *should* be active (set by isPlaying prop)
    uniform float uTransitionProgress;  // Current interpolation factor between logo and visualizer
    uniform sampler2D uFrequencyTexture;
    uniform float uVisualizerHeightScale;
    uniform float uVisualizerBaselineY;
    uniform float uVisualizerWidth;
    uniform float uVisualizerOverallScale;
    uniform vec3 uVisualizerColor;

    void main() {
      vColor = color;
      vec3 basePosition = position; // The original, untransformed particle position from the SVG

      // --- Calculate LOGO state ---
      vec3 logoCurrentPosition = basePosition;
      float timeScaled = uTime * uNoiseSpeed;
      vec3 noiseInputBase = logoCurrentPosition * uNoiseScale;
      float noiseX = snoise(noiseInputBase + vec3(timeScaled, 0.0, 0.0));
      float noiseY = snoise(noiseInputBase + vec3(0.0, timeScaled, 0.0));
      float noiseZ = snoise(noiseInputBase + vec3(0.0, 0.0, timeScaled));
      vec3 displacement = vec3(noiseX, noiseY, noiseZ) * uDisplacementStrength;
      vec3 logoDisplacedPosition = logoCurrentPosition + displacement;

      // Store noiseY for vNoiseVal before mouse interaction might alter logoDisplacedPosition further
      float noiseValEffect = (noiseY + 1.0) / 2.0;

      float distToMousePlane = distance(logoDisplacedPosition.xy, uMouse.xy);
      float interactionFactor = smoothstep(uInteractionRadius * 4.5, 0.0, distToMousePlane);
      if (interactionFactor > 0.0 && (abs(uPushStrength) > 0.001 || abs(uBubbleStrength) > 0.001) ) {
          vec3 directionToMouse = normalize(logoDisplacedPosition - uMouse);
          if (length(directionToMouse) < 0.0001) {
              directionToMouse = vec3(0.0, 0.0, 1.0);
          }
          vec3 pushDisplacement = directionToMouse * interactionFactor * uPushStrength;
          logoDisplacedPosition += pushDisplacement;
          logoDisplacedPosition.z += interactionFactor * uBubbleStrength;
      }
      // Point size for LOGO state (based on its displaced Y)
      float normalizedYForLogoSize = 0.0;
      if (uYSpan > 0.000001) {
          normalizedYForLogoSize = (logoDisplacedPosition.y - uMinY) / uYSpan;
      }
      normalizedYForLogoSize = clamp(normalizedYForLogoSize, 0.0, 1.0);
      float logoDotSize = mix(uBottomDotSize, uTopDotSize, normalizedYForLogoSize);
      // --- End LOGO state calculation ---


      // --- Calculate VISUALIZER state ---
      vec3 visualizerLinePos;
      visualizerLinePos.x = (particleUCoord - 0.5) * uVisualizerWidth; // Center the line based on U-coord
      visualizerLinePos.y = uVisualizerBaselineY;
      visualizerLinePos.z = 0.0; // Keep it flat on the Z=0 plane (local to Points)

      float freqValueNormalized = 0.0; // Frequency value from texture, normalized 0-1
      if (uIsPlayingVisualizer > 0.5) { // Only sample texture if active
           freqValueNormalized = texture2D(uFrequencyTexture, vec2(particleUCoord, 0.5)).r;
           visualizerLinePos.y += freqValueNormalized * uVisualizerHeightScale;
      }

      // Point size for VISUALIZER state
      float visualizerDotSize = uVisualizerOverallScale;
      // --- End VISUALIZER state calculation ---


      // --- Interpolate between states ---
      vec3 finalMixedPosition = mix(logoDisplacedPosition, visualizerLinePos, uTransitionProgress);
      float currentDotSize = mix(logoDotSize, visualizerDotSize, uTransitionProgress);
      
      // vNoiseVal should fade out as we transition to the visualizer
      vNoiseVal = noiseValEffect * (1.0 - smoothstep(0.0, 0.7, uTransitionProgress));


      gl_PointSize = max(1.0, currentDotSize);
      vec4 modelViewPosition = modelViewMatrix * vec4(finalMixedPosition, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec3 vColor;
    varying float vNoiseVal; 
    // varying float vVisualizerNormalizedHeight; // REMOVED: Receive normalized height
    uniform sampler2D uParticleTexture;
    uniform float uTransitionProgress; // Need transition progress here too
    uniform vec3 uVisualizerColor; // Need visualizer color here

    void main() {
      vec4 texColor = texture2D(uParticleTexture, gl_PointCoord);
      
      if (texColor.a < 0.2) discard; 

      float alpha = texColor.a;
      
      // Define a brighter yellow target color - make it less white at peak
      // vec3 brightYellow = vec3(1.0, 1.0, 0.2); // REMOVED
      
      // Calculate the target visualizer color based on height (lerp from base uVisualizerColor towards brightYellow)
      // vec3 heightAdjustedVisualizerColor = mix(uVisualizerColor, brightYellow, vVisualizerNormalizedHeight); // REMOVED
      
      // Interpolate color between original particle color and the uniform visualizer color
      vec3 finalColor = mix(vColor, uVisualizerColor, uTransitionProgress);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ ParticleShaderMaterial });

// Original setupAudioAnalyser to be REPLACED
const setupAudioAnalyser = (existingAudioContext, existingSourceNode, audioElement, fftSize = 256) => {
  if (!existingAudioContext || !existingSourceNode) {
    console.error("LogoParticles: Missing audioContext or sourceNode for analyser setup.");
    return null;
  }

  if (existingAudioContext.state === 'suspended') {
    existingAudioContext.resume();
  }

  // Create a new AnalyserNode specific to LogoParticles
  const analyser = existingAudioContext.createAnalyser();
  analyser.fftSize = fftSize;
  // smoothingTimeConstant will be set from props directly on this analyser

  try {
    // Connect the shared sourceNode to this new local analyser
    // We should not disconnect the sourceNode from other analysers (e.g., the one in App.js)
    existingSourceNode.connect(analyser);
  } catch (e) {
    console.error("LogoParticles: Error connecting shared sourceNode to local analyser:", e);
    return null; // Prevent further issues if connection fails
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Return the local analyser and its data, along with the context (for state checks) and source (for disconnect)
  return { analyser, audioContext: existingAudioContext, sourceNode: existingSourceNode, frequencyData: dataArray, bufferLength };
};


const LogoParticles = ({
  audioRef,
  isPlaying,
  audioContext,
  sourceNode,
  particleOptions,
  bottomHeightDivider,
  middleHeightDivider,
  topHeightDivider,
  bottomColor,
  middleColor,
  topColor,
  topDotSize,
  bottomDotSize,
  noiseScale,
  noiseSpeed,
  displacementStrength,
  interactionRadius,
  pushStrength,
  bubbleStrength,
  interactionDecayTime,
  logoPosition,
  animateMiddleColor,
  middleColorShiftSpeed,
  middleColorShiftRange,
  animateTopColor,
  topColorShiftSpeed,
  topColorShiftRange,
  // New Visualizer Props
  visualizerBaselineY = -50.0,
  visualizerHeightScale = 70.0,
  visualizerWidth = 200.0, // Default width of the visualizer line
  visualizerFftSize = 256,
  visualizerSmoothing = 0.8,
  visualizerOverallScale = 1.0,
  visualizerColor = '#00ffff',
}) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  // `particleGeometryData` will store positions, colors, and the new uCoords
  const [particleGeometryData, setParticleGeometryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { gl, camera } = useThree();

  const actualParticleTexture = useTexture(particleTextureUrl);

  const baseMiddleColor = useMemo(() => new THREE.Color(middleColor), [middleColor]);
  const baseTopColor = useMemo(() => new THREE.Color(topColor), [topColor]);
  const currentMiddleColorRef = useRef(new THREE.Color(middleColor));
  const currentTopColorRef = useRef(new THREE.Color(topColor));
  const tBottomColor = useMemo(() => new THREE.Color(bottomColor), [bottomColor]);

  // Renamed yRange to particleExtents to store min/max for X and Y of original logo
  const particleExtents = useRef({ minY: 0, maxY: 0.00001, minX: 0, maxX: 0.00001 });

  const activeMousePosition3D = useRef(new THREE.Vector3(10000, 10000, 0));
  const isInteractingRef = useRef(false);
  const dampedPushStrengthRef = useRef(0);
  const dampedBubbleStrengthRef = useRef(0);

  const vec = useRef(new THREE.Vector3());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const ray = useRef(new THREE.Ray());

  const tempHSL = useMemo(() => ({ h: 0, s: 0, l: 0 }), []);
  const baseMiddleHSL = useMemo(() => baseMiddleColor.getHSL(tempHSL), [baseMiddleColor, tempHSL]);
  const baseTopHSL = useMemo(() => baseTopColor.getHSL(tempHSL), [baseTopColor, tempHSL]);

  const audioAnalyserHandlesRef = useRef(null);
  const frequencyTextureRef = useRef(null);
  const targetTransitionState = useRef(0); // 0 for logo, 1 for visualizer
  const currentTransitionAnimVal = useRef(0); // Animated value for uTransitionProgress

  // This ref will hold the BufferAttribute for particleUCoord
  const particleUCoordBufferAttr = useRef(null);

  // --- Debug Log Effect ---
  useEffect(() => {
    console.log(`LogoParticles Update: isPlaying=${isPlaying}, audioRef.current exists: ${!!audioRef?.current}`);
  }, [isPlaying, audioRef]);
  // --- End Debug Log Effect ---

  useEffect(() => {
    if (!animateMiddleColor) currentMiddleColorRef.current.set(middleColor);
  }, [middleColor, animateMiddleColor]);

  useEffect(() => {
    if (!animateTopColor) currentTopColorRef.current.set(topColor);
  }, [topColor, animateTopColor]);

  // Setup Audio Analyser
  useEffect(() => {
    // Now expects audioContext and sourceNode from props
    if (audioContext && sourceNode && audioRef?.current) { // Ensure all are present
      if (isPlaying) {
        // We only setup our local analyser if it doesn't exist or if the context has become closed
        // The external context/source should persist.
        if (!audioAnalyserHandlesRef.current || audioAnalyserHandlesRef.current.audioContext.state === 'closed') {
          // Pass the received audioContext and sourceNode
          const handles = setupAudioAnalyser(audioContext, sourceNode, audioRef.current, visualizerFftSize);
          if (handles) {
            audioAnalyserHandlesRef.current = handles; // Stores our local analyser and shared context/source
            handles.analyser.smoothingTimeConstant = visualizerSmoothing;
            if (frequencyTextureRef.current) frequencyTextureRef.current.dispose();
            frequencyTextureRef.current = new THREE.DataTexture(
              handles.frequencyData, handles.bufferLength, 1,
              THREE.RedFormat, THREE.UnsignedByteType
            );
          } else { console.error("LogoParticles: Failed to setup local audio analyser."); }
        }
        // If our local analyser setup exists and its context (the shared one) is suspended, resume it.
        if (audioAnalyserHandlesRef.current?.audioContext.state === 'suspended') {
          audioAnalyserHandlesRef.current.audioContext.resume();
        }
        targetTransitionState.current = 1.0;
      } else {
        targetTransitionState.current = 0.0;
        // When stopping, we should disconnect our local analyser from the shared sourceNode
        if (audioAnalyserHandlesRef.current) {
          const { sourceNode: sharedSource, analyser: localAnalyser } = audioAnalyserHandlesRef.current;
          try {
            sharedSource.disconnect(localAnalyser); // Disconnect only our analyser
            console.log("LogoParticles: Disconnected local analyser from shared source.");
          } catch (e) { console.warn("LogoParticles: Error disconnecting local analyser:", e); }
          audioAnalyserHandlesRef.current = null; // Clear our local handles
        }
      }
    } else {
      targetTransitionState.current = 0.0; // No audio, stay as logo
      if (audioAnalyserHandlesRef.current) { // Cleanup if props disappear
          const { sourceNode: sharedSource, analyser: localAnalyser } = audioAnalyserHandlesRef.current;
          try { sharedSource.disconnect(localAnalyser); } catch (e) { }
          audioAnalyserHandlesRef.current = null;
        }
    }
  }, [isPlaying, audioRef, audioContext, sourceNode, visualizerFftSize, visualizerSmoothing]); // Add audioContext and sourceNode to dependencies

  // Cleanup Audio Analyser on unmount or if audioRef changes
  useEffect(() => {
    return () => {
      // Cleanup focuses on what LogoParticles *owns* or *specifically connected*
      if (audioAnalyserHandlesRef.current) {
        const { sourceNode: sharedSource, analyser: localAnalyser } = audioAnalyserHandlesRef.current;
        // Disconnect our local analyser from the shared source
        if (sharedSource && localAnalyser && typeof sharedSource.disconnect === 'function') {
          try { sharedSource.disconnect(localAnalyser); } catch (e) { console.warn("LogoParticles cleanup: Error disconnecting local analyser:", e);}
        }
        audioAnalyserHandlesRef.current = null;
      }
      if (frequencyTextureRef.current) {
        frequencyTextureRef.current.dispose();
        frequencyTextureRef.current = null;
      }
      // We no longer manage _audioContext or _mediaElementSource on audioRef.current here
      // App.js is the owner of those.
    };
  // Key cleanup to audioRef, audioContext, sourceNode. If these top-level objects change,
  // previous connections should be severed.
  }, [audioRef, audioContext, sourceNode]);


  // Process Image to Particles & Calculate UCoords
  useEffect(() => {
    setIsLoading(true);
    imageToParticleData(GrooveWashLogoSrc, particleOptions)
      .then(rawParticleData => {
        if (rawParticleData && rawParticleData.positions) {
          let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
          for (let i = 0; i < rawParticleData.positions.length; i += 3) {
            const x = rawParticleData.positions[i];
            const y = rawParticleData.positions[i + 1];
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
          particleExtents.current = {
            minY, maxY: maxY === minY ? minY + 1e-5 : maxY,
            minX, maxX: maxX === minX ? minX + 1e-5 : maxX,
          };

          const numParticles = rawParticleData.positions.length / 3;
          const logoXSpan = Math.max(1e-5, particleExtents.current.maxX - particleExtents.current.minX);
          const uCoordsArray = new Float32Array(numParticles);
          for (let i = 0; i < numParticles; i++) {
            const particleX = rawParticleData.positions[i * 3];
            uCoordsArray[i] = (particleX - particleExtents.current.minX) / logoXSpan;
          }
          // Create or update the BufferAttribute for particleUCoord
          if (particleUCoordBufferAttr.current) {
            particleUCoordBufferAttr.current.array = uCoordsArray;
            particleUCoordBufferAttr.current.needsUpdate = true;
          } else {
            particleUCoordBufferAttr.current = new THREE.BufferAttribute(uCoordsArray, 1);
          }

          // Calculate initial colors (copied from your original useMemo for initialColorsArray)
          const calculatedColors = new Float32Array(numParticles * 3);
          const currentMinY_color = particleExtents.current.minY;
          const calculatedYSpan_color = particleExtents.current.maxY - currentMinY_color;
          const ySpanForColorLogic = Math.max(1e-5, calculatedYSpan_color);
          const tempColor = new THREE.Color();
          const bDiv = bottomHeightDivider;
          const mDiv = Math.max(bDiv, middleHeightDivider);
          const tDiv = Math.max(mDiv, topHeightDivider);
          const midCol = new THREE.Color(middleColor);
          const topCol = new THREE.Color(topColor);
          for (let i = 0; i < numParticles; i++) {
            const i3 = i * 3;
            const originalY = rawParticleData.positions[i3 + 1];
            const normalizedYForColor = (originalY - currentMinY_color) / ySpanForColorLogic;
            if (normalizedYForColor <= bDiv) { tempColor.copy(tBottomColor); }
            else if (normalizedYForColor <= mDiv) {
              const sr = Math.max(1e-5, mDiv - bDiv); tempColor.copy(tBottomColor).lerp(midCol, (normalizedYForColor - bDiv) / sr);
            } else if (normalizedYForColor <= tDiv) {
              const sr = Math.max(1e-5, tDiv - mDiv); tempColor.copy(midCol).lerp(topCol, (normalizedYForColor - mDiv) / sr);
            } else { tempColor.copy(topCol); }
            calculatedColors[i3] = tempColor.r;
            calculatedColors[i3 + 1] = tempColor.g;
            calculatedColors[i3 + 2] = tempColor.b;
          }
          
          setParticleGeometryData({
            positions: rawParticleData.positions, // This is the Float32Array for 'position'
            colors: calculatedColors, // This is the Float32Array for 'color'
            // uCoords are handled by particleUCoordBufferAttr.current directly
          });
        } else { setParticleGeometryData(null); }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error processing image for particles:", error);
        setIsLoading(false); setParticleGeometryData(null);
      });
  }, [particleOptions, GrooveWashLogoSrc, bottomHeightDivider, middleHeightDivider, topHeightDivider, bottomColor, middleColor, topColor, tBottomColor]);


  // Mouse Move Listeners
  useEffect(() => {
    const canvasElement = gl.domElement;
    const handleMouseMove = (event) => {
      if (!pointsRef.current || !camera || !canvasElement) { 
        isInteractingRef.current = false; return;
      }
      
        const rect = canvasElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
            isInteractingRef.current = false; return;
        }
        const ndcX = (mouseX / rect.width) * 2 - 1;
        const ndcY = -(mouseY / rect.height) * 2 + 1;

        vec.current.set(ndcX, ndcY, 0.5);
        vec.current.unproject(camera);
        vec.current.sub(camera.position).normalize();
        ray.current.set(camera.position, vec.current);
        
        // Use .get() on logoPosition as it's an AnimatedValue from react-spring
        const currentLogoPosArray = logoPosition.get(); 
        const logoWorldPosVec = new THREE.Vector3().fromArray(currentLogoPosArray || [0,0,0]);
        
        const camZDir = new THREE.Vector3();
        camera.getWorldDirection(camZDir);
        plane.current.setFromNormalAndCoplanarPoint(camZDir.multiplyScalar(-1), logoWorldPosVec);
        
        const intersectionPoint = new THREE.Vector3();
        if (ray.current.intersectPlane(plane.current, intersectionPoint)) {
            if (pointsRef.current) {
                const inverseMatrix = pointsRef.current.matrixWorld.clone().invert();
                activeMousePosition3D.current.copy(intersectionPoint).applyMatrix4(inverseMatrix);
                isInteractingRef.current = true;
            } else { isInteractingRef.current = false; }
        } else { isInteractingRef.current = false; }
    };
    const handleMouseLeave = () => { isInteractingRef.current = false; };
    canvasElement.addEventListener('mousemove', handleMouseMove);
    canvasElement.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      canvasElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gl, camera, logoPosition]);


  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    // Animate colors (original logic)
    if (animateMiddleColor) {
      const h = baseMiddleHSL.h + Math.sin(time * middleColorShiftSpeed) * middleColorShiftRange;
      currentMiddleColorRef.current.setHSL(h % 1, baseMiddleHSL.s, baseMiddleHSL.l);
    }
    if (animateTopColor) {
      const h = baseTopHSL.h + Math.sin(time * topColorShiftSpeed) * topColorShiftRange;
      currentTopColorRef.current.setHSL(h % 1, baseTopHSL.s, baseTopHSL.l);
    }

    // Update particle colors attribute if animation is active (original logic)
    if (pointsRef.current?.geometry && particleGeometryData?.colors && (animateMiddleColor || animateTopColor)) {
      const colorAttribute = pointsRef.current.geometry.attributes.color;
      if (colorAttribute?.array) { // Ensure .array exists
        // ... (original color update loop, using particleGeometryData.positions for originalY)
        const numParticles = particleGeometryData.positions.length / 3;
        const currentMinY_color = particleExtents.current.minY;
        const calculatedYSpan_color = particleExtents.current.maxY - currentMinY_color;
        const ySpanForColorLogic = Math.max(1e-5, calculatedYSpan_color);
        const tempColor = new THREE.Color();
        const bDiv = bottomHeightDivider;
        const mDiv = Math.max(bDiv, middleHeightDivider);
        const tDiv = Math.max(mDiv, topHeightDivider);

        for (let i = 0; i < numParticles; i++) {
            const i3 = i * 3;
            const originalY = particleGeometryData.positions[i3 + 1];
            const normalizedYForColor = (originalY - currentMinY_color) / ySpanForColorLogic;

            if (normalizedYForColor <= bDiv) { tempColor.copy(tBottomColor); }
            else if (normalizedYForColor <= mDiv) {
                const sr = Math.max(1e-5, mDiv - bDiv); tempColor.copy(tBottomColor).lerp(currentMiddleColorRef.current, (normalizedYForColor - bDiv) / sr);
            } else if (normalizedYForColor <= tDiv) {
                const sr = Math.max(1e-5, tDiv - mDiv); tempColor.copy(currentMiddleColorRef.current).lerp(currentTopColorRef.current, (normalizedYForColor - mDiv) / sr);
            } else { tempColor.copy(currentTopColorRef.current); }
            colorAttribute.array[i3] = tempColor.r;
            colorAttribute.array[i3 + 1] = tempColor.g;
            colorAttribute.array[i3 + 2] = tempColor.b;
        }
        colorAttribute.needsUpdate = true;
      }
    }

    // Update audio frequency data texture
    if (isPlaying && audioAnalyserHandlesRef.current && frequencyTextureRef.current && currentTransitionAnimVal.current > 0.01) {
      const { analyser, frequencyData } = audioAnalyserHandlesRef.current;
      analyser.getByteFrequencyData(frequencyData); // frequencyData is Uint8Array(0-255)
      frequencyTextureRef.current.needsUpdate = true;
    }

    // Animate transition progress
    currentTransitionAnimVal.current = THREE.MathUtils.damp(
      currentTransitionAnimVal.current, targetTransitionState.current, 8.0, delta
    );

    // Update shader uniforms
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms;
      // Original uniforms
      uniforms.uTime.value = time;
      uniforms.uMinY.value = particleExtents.current.minY;
      uniforms.uYSpan.value = Math.max(1e-5, particleExtents.current.maxY - particleExtents.current.minY);
      uniforms.uTopDotSize.value = topDotSize;
      uniforms.uBottomDotSize.value = bottomDotSize;
      uniforms.uNoiseScale.value = noiseScale;
      uniforms.uNoiseSpeed.value = noiseSpeed;
      uniforms.uDisplacementStrength.value = displacementStrength;

      const interactionAllowed = currentTransitionAnimVal.current < 0.75;
      const currentPush = isInteractingRef.current && interactionAllowed ? pushStrength : 0;
      const currentBubble = isInteractingRef.current && interactionAllowed ? bubbleStrength : 0;
      const decayLambda = Math.max(0.1, interactionDecayTime || 4);
      dampedPushStrengthRef.current = THREE.MathUtils.damp(dampedPushStrengthRef.current, currentPush, decayLambda, delta);
      dampedBubbleStrengthRef.current = THREE.MathUtils.damp(dampedBubbleStrengthRef.current, currentBubble, decayLambda, delta);

      // Fade interaction strength based on transition progress
      const effectivePush = dampedPushStrengthRef.current * (1.0 - currentTransitionAnimVal.current);
      const effectiveBubble = dampedBubbleStrengthRef.current * (1.0 - currentTransitionAnimVal.current);

      uniforms.uMouse.value.copy(activeMousePosition3D.current);
      uniforms.uInteractionRadius.value = interactionRadius;
      uniforms.uPushStrength.value = effectivePush; // Use faded value
      uniforms.uBubbleStrength.value = effectiveBubble; // Use faded value

      // Visualizer uniforms - Pass new props
      uniforms.uIsPlayingVisualizer.value = targetTransitionState.current; 
      uniforms.uTransitionProgress.value = currentTransitionAnimVal.current; 
      if (frequencyTextureRef.current) {
        uniforms.uFrequencyTexture.value = frequencyTextureRef.current;
      } else {
        // Ensure a default texture is always bound if frequencyTextureRef is null temporarily
         if (!uniforms.uFrequencyTexture.value) { // Check if it's already set to a default
            const defaultTex = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat, THREE.UnsignedByteType);
            defaultTex.needsUpdate = true;
            uniforms.uFrequencyTexture.value = defaultTex;
         }
      }
      uniforms.uVisualizerHeightScale.value = visualizerHeightScale;
      uniforms.uVisualizerBaselineY.value = visualizerBaselineY;
      uniforms.uVisualizerWidth.value = visualizerWidth;
      uniforms.uVisualizerOverallScale.value = visualizerOverallScale;
      uniforms.uVisualizerColor.value.set(visualizerColor);
    }
  });

  if (isLoading || !particleGeometryData || !particleGeometryData.positions || !particleGeometryData.colors || !particleUCoordBufferAttr.current) {
    return null;
  }

  return (
    <Points
      ref={pointsRef}
      positions={particleGeometryData.positions} // Original positions from imageToParticleData
      frustumCulled={false}
      key={particleOptions.amount} // Re-create Points if amount changes
    >
      <bufferAttribute
        attach="geometry-attributes-color"
        args={[particleGeometryData.colors, 3]}
      />
      <bufferAttribute
        attach="geometry-attributes-particleUCoord"
        {...particleUCoordBufferAttr.current} // Pass the attribute object
      />
      <particleShaderMaterial
        key={ParticleShaderMaterial.key} // From drei's shaderMaterial, for hot-reloading shaders
        ref={materialRef}
        uParticleTexture={actualParticleTexture}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default LogoParticles;