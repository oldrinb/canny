/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Canny Edge Detector. Step 4 - Hysteresis thresholding.
 * It uses two thresholds to determine potential edges. If current pixel is
 * above the high threshold, it is marked as "strong". If it is between the two
 * thresholds, it is marked as "weak". Everything else is discarded.
 * "Strong" pixels are valid edge points. In the next step (5a - Edge linking),
 * it will be determined which of the "weak" pixels are part of the edge, and
 * which are noise.
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 20, 2024
 **/
 
const thresholdingShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const float FLOAT_MIN_VALUE;
    const float FLOAT_MAX_VALUE;
    const float ZERO_PLUS;
    const float LOW_THRES_INTENSITY;

    uniform sampler2D texSampler1, texSampler2;
    uniform float lowThreshold, highThreshold;
    uniform float maxGradient;

    highp float decode2Bytes(lowp vec2);

    #ifdef WEBGL2
    out lowp float outputColor;

    highp float decodeBWTexel(sampler2D, sampler2D, ivec2);

    #else
    varying vec2 fTexCoord;

    lowp float outputColor;

    highp float decodeBWTexture(sampler2D, sampler2D, vec2);
    #endif



    void main() {
      #ifdef WEBGL2
      highp float intensity =
          decodeBWTexel(texSampler1, texSampler2, ivec2(gl_FragCoord.xy));
      #else
      highp float intensity =
          decodeBWTexture(texSampler1, texSampler2, fTexCoord);
      #endif

      // Normalize
      if (maxGradient > ZERO_PLUS) intensity /= maxGradient;

      // Strong pixels
      if (intensity > highThreshold) outputColor = 1.0;
      // Weak pixels
      else if (intensity > lowThreshold) outputColor = LOW_THRES_INTENSITY;

      else discard;
      
      #ifndef WEBGL2
      gl_FragColor.r = outputColor;
      #endif
    }
  `
};
