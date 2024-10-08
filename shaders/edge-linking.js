/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Canny Edge Detector. Step 5a - Edge linking.
 * "Strong" pixels determined at step 4 (Hysteresis thresholding) are valid
 * edge points, but these edges contain gaps. This step is needed to fill the
 * gaps in the edges determined above. If current pixel is "weak", it will be
 * marked as valid, only if it is connected with a "strong" neighbor.
 * This shader is called multiple times, using a technique called "ping-pong
 * shading", until only isolated "weak" pixels are left. They are assumed to
 * come from noise, and discarded in the next step 5b (Clean up).
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 20, 2024
 **/
 
const edgeLinkingShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const int IMAGE_WIDTH;
    const int IMAGE_HEIGHT;
    const float LOW_THRES_INTENSITY;
    const float EPSILON;

    uniform sampler2D texSampler;

    #ifdef WEBGL2
    out lowp float outputColor;

    ivec2 getTexelCoord(int, int);

    #else
    varying vec2 fTexCoord;	
    
    lowp float outputColor;

    vec2 getTextureCoord(int, int);
    #endif


    // Check if there is any "strong" neighbor, using 8-connectivity.
    lowp float getMaxConnectedPixel() {
      lowp float max = 0.0;

      #ifdef WEBGL2
      lowp float intensity = texelFetch(texSampler, getTexelCoord(-1, 0), 0).r;
      #else
      lowp float intensity = texture2D(texSampler, getTextureCoord(-1, 0)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(1, 0), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(1, 0)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(0, -1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(0, -1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(0, 1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(0, 1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(-1, -1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(-1, -1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(1, 1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(1, 1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(-1, 1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(-1, 1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      #ifdef WEBGL2
      intensity = texelFetch(texSampler, getTexelCoord(1, -1), 0).r;
      #else
      intensity = texture2D(texSampler, getTextureCoord(1, -1)).r;
       #endif
      if (intensity > 1.0 - EPSILON) return 1.0;
      if (intensity > max) max = intensity;

      return max;
    }



    void main() {
      #ifdef WEBGL2
      lowp float gradient = texelFetch(texSampler, ivec2(gl_FragCoord.xy), 0).r;
      #else
      lowp float gradient = texture2D(texSampler, fTexCoord).r;
      #endif

      // If current pixel is "strong", it will not be changed.
      if (gradient > 1.0 - EPSILON) outputColor = 1.0;

      // If current pixel is "weak", it will be marked as valid, only if it
      // is connected with a "strong" neighbor, using 8-connectivity.
      else if (gradient > LOW_THRES_INTENSITY - EPSILON &&
               gradient < LOW_THRES_INTENSITY + EPSILON) {
        lowp float max = getMaxConnectedPixel();

        if (max > 1.0 - EPSILON) outputColor = 1.0;
        else if (max < EPSILON) discard;
        else outputColor = gradient;
      }

      else discard;

      #ifndef WEBGL2
      gl_FragColor.r = outputColor;
      #endif
    }`
};
