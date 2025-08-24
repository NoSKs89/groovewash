// src/utils/imageToParticles.js

/**
 * Scales and draws an image onto a canvas context, centering it.
 * @param {HTMLImageElement} img - The image to draw.
 * @param {CanvasRenderingContext2D} context - The 2D rendering context of the canvas.
 */
function drawImageScaled(img, context) {
    const canvas = context.canvas;
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio);
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, img.width, img.height,
      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  }
  
  /**
   * Adjusts the size of an array to a maximum, either by removing random elements
   * or by duplicating existing elements.
   * @param {Array<any>} array - The array to modify.
   * @param {number} max - The target maximum size of the array.
   * @returns {Array<any>} The modified array.
   */
  function fillUp(array, max) {
    let newArray = [...array]; // Work on a copy
    if (newArray.length === 0 && max > 0) return []; // Cannot fill up an empty array unless max is 0
  
    if (newArray.length > max) {
      while (newArray.length > max) {
        newArray.splice(Math.floor(Math.random() * newArray.length), 1);
      }
    } else if (newArray.length < max && newArray.length > 0) {
      const originalLength = newArray.length;
      for (let i = 0; i < max - originalLength; i++) {
        newArray.push(newArray[Math.floor(Math.random() * originalLength)]);
      }
    }
    return newArray;
  }
  
  /**
   * Shuffles an array in place.
   * @param {Array<any>} a - The array to shuffle.
   * @returns {Array<any>} The shuffled array.
   */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  /**
   * Loads an image and processes it to extract particle data (positions and colors).
   * @param {string} imageUrl - The URL of the image to process.
   * @param {object} options - Configuration options.
   * @param {number} options.resolution - The resolution of the internal canvas for image sampling.
   * @param {number} options.density - A scaling factor for particle positions.
   * @param {number} options.amount - The target number of particles.
   * @returns {Promise<{positions: Float32Array, colors: Float32Array}>}
   */
  export async function imageToParticleData(imageUrl, options) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Essential for getImageData with external or SVG images
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); // willReadFrequently for performance
  
        canvas.width = options.resolution;
        canvas.height = options.resolution;
  
        drawImageScaled(img, ctx);
  
        const imageData = ctx.getImageData(0, 0, options.resolution, options.resolution);
        const data = imageData.data;
        const rawCoords = [];
  
        for (let y = 0; y < options.resolution; y++) {
          for (let x = 0; x < options.resolution; x++) {
            const index = (y * options.resolution + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
  
            if (a > 128) { // Only use sufficiently opaque pixels
              rawCoords.push({
                x: options.density * (x - options.resolution / 2),
                y: options.density * (options.resolution / 2 - y), // Flip Y to match common 3D coords
                z: (Math.random() - 0.5) * options.density * 0.5, // Slight random depth
                color: [r / 255, g / 255, b / 255],
              });
            }
          }
        }
  
        const finalCoords = shuffle(fillUp(rawCoords, options.amount));
  
        const positions = new Float32Array(finalCoords.length * 3);
        const colors = new Float32Array(finalCoords.length * 3);
  
        finalCoords.forEach((p, i) => {
          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;
          colors[i * 3] = p.color[0];
          colors[i * 3 + 1] = p.color[1];
          colors[i * 3 + 2] = p.color[2];
        });
  
        resolve({ positions, colors });
      };
      img.onerror = (err) => {
        console.error("Failed to load image for particle conversion:", imageUrl, err);
        reject(err);
      };
      img.src = imageUrl;
    });
  }