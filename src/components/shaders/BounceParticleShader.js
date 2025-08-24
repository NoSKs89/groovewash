import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// --- Custom Shader Material for Bouncing Particles ---
const BounceParticleShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uSize: 0.4,  // INCREASED base size
    uColor: new THREE.Color('whitesmoke'),
    uGlowPower: 3.5, 
    
    // Bounce specific uniforms
    uBounceStartTime: -1.0, 
    uBounceDuration: 6.0,  // INCREASED duration further
    uMaxRadius: 4.0,       
    uWaveFrequency: 5.0,  
    uWaveAmplitude: 0.6,   // INCREASED amplitude further
    uWaveSpeed: 5.0        
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uSize;
    uniform vec3 uColor;
    uniform float uBounceStartTime;
    uniform float uBounceDuration;
    uniform float uMaxRadius;
    uniform float uWaveFrequency;
    uniform float uWaveAmplitude;
    uniform float uWaveSpeed;

    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      vColor = uColor;
      vAlpha = 0.0; 
      float timeSinceBounce = uTime - uBounceStartTime;

      if (uBounceStartTime >= 0.0 && timeSinceBounce >= 0.0 && timeSinceBounce < uBounceDuration) {
          float bounceProgress = timeSinceBounce / uBounceDuration; 
          float currentRippleRadius = bounceProgress * uMaxRadius;
          float horizontalDist = length(position.xz); 

          if (horizontalDist <= currentRippleRadius) {
              float wavePhase = horizontalDist * uWaveFrequency - timeSinceBounce * uWaveSpeed;
              float yOffset = sin(wavePhase) * uWaveAmplitude;
              yOffset *= (1.0 - bounceProgress);

              // --- SIMPLIFIED ALPHA --- 
              // Make alpha primarily dependent on bounce progress for fade out
              vAlpha = 1.0 - bounceProgress;
              vAlpha = pow(vAlpha, 1.5); // Keep the slight power curve for fade

              vec3 displacedPosition = position + vec3(0.0, yOffset, 0.0);
              vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectedPosition = projectionMatrix * viewPosition;
              gl_Position = projectedPosition;

              // --- ADJUSTED SIZE --- 
              gl_PointSize = uSize * vAlpha * (200.0 / -viewPosition.z); 
              gl_PointSize = max(gl_PointSize, 1.0); // INCREASED minimum size clamp
          } else {
              gl_Position = vec4(0.0, 0.0, 0.0, 0.0); 
              gl_PointSize = 0.0;
              vAlpha = 0.0;
          }
      } else {
          gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
          gl_PointSize = 0.0;
          vAlpha = 0.0;
      }
    }
  `,
  // Fragment Shader
  `
    uniform float uGlowPower;
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
        if (vAlpha <= 0.0) discard;
        float strength = distance(gl_PointCoord, vec2(0.5));
        strength = 1.0 - strength;
        strength = pow(strength, uGlowPower);
        vec3 baseColor = mix(vec3(0.0), vColor, strength);
        gl_FragColor = vec4(baseColor, strength * vAlpha);
    }
  `
);

// Register the custom material with R3F
extend({ BounceParticleShaderMaterial });

export { BounceParticleShaderMaterial }; 