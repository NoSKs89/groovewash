import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// --- Custom Shader Material for Particles ---
const ParticleShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uSize: 0.25, // Adjusted size for glow effect
    uColor: new THREE.Color('whitesmoke'),
    uGlowPower: 3.5, // Controls the sharpness of the glow falloff
    uJitterAmplitude: 0.15, // Increased jitter slightly
    uJitterSpeed: 0.3      // Slowed down jitter slightly
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uSize;
    uniform float uJitterAmplitude;
    uniform float uJitterSpeed;
    
    // Declare the noise function signature before using it
    float snoise(vec3 v);

    // Passing distance to fragment shader if needed for color variation (optional)
    // varying float vDistance;

    void main() {
      // Jitter calculation based on original position and time-varying noise
      // Use position itself + time for unique noise per particle over time
      float noiseFactor = snoise(vec3(position.x * 0.5, position.y * 0.5 + uTime * uJitterSpeed * 0.2, position.z * 0.5 + uTime * uJitterSpeed));
      vec3 jitterOffset = vec3(
          sin(position.y * 2.0 + uTime * uJitterSpeed * 1.1 + noiseFactor * 3.14) * uJitterAmplitude,
          cos(position.x * 2.0 + uTime * uJitterSpeed * 1.2 + noiseFactor * 3.14) * uJitterAmplitude,
          sin(position.z * 2.0 + uTime * uJitterSpeed * 0.9 + noiseFactor * 3.14) * uJitterAmplitude
      );
      
      vec3 displacedPosition = position + jitterOffset;

      vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
      
      // Size attenuation (makes particles smaller further away)
      gl_PointSize = uSize * (200.0 / -viewPosition.z); // Adjust 200.0 for desired scaling
      gl_PointSize = max(gl_PointSize, 1.0); // Ensure minimum size

      // Optional: Pass distance for fragment shader
      // vDistance = distance(vec3(0.0), displacedPosition);
    }
    // Inject the actual noise function code here
    // --- START OF EMBEDDED snoise3d.glsl ---
    //	Simplex 3D Noise 
    //	by Ian McEwan, Ashima Arts
    //
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      //  x0 = x0 - 0. + 0.0 * C 
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
      float n_ = 1.0/7.0; // N=7
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

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

    //Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

    // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    // --- END OF EMBEDDED snoise3d.glsl ---
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform float uGlowPower;
    // varying float vDistance; // If using distance-based color

    void main() {
      // Calculate distance from the center of the point sprite
      float strength = distance(gl_PointCoord, vec2(0.5));
      // Inverse and map to [0, 1]
      strength = 1.0 - strength;
      // Sharpen the falloff with power
      strength = pow(strength, uGlowPower);

      // Base color
      vec3 color = uColor;
      
      // Optional: Mix color based on distance from center of scene
      // color = mix(color, vec3(0.97, 0.70, 0.45), vDistance * 0.1); 

      // Apply strength to color and alpha
      color = mix(vec3(0.0), color, strength);
      gl_FragColor = vec4(color, strength);
    }
  `
);

// Register the custom material with R3F
extend({ ParticleShaderMaterial });

export { ParticleShaderMaterial }; // Export the material class itself 