/*<?xml version="1.0" encoding="utf-8"?>*/
 
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

    highp float decodeBwTexel(sampler2D, sampler2D, ivec2);

    #else
    varying vec2 fTexCoord;

    lowp float outputColor;

    highp float decodeBwTexture(sampler2D, sampler2D, vec2);
    #endif



    void main() {
      #ifdef WEBGL2
      highp float intensity =
          decodeBwTexel(texSampler1, texSampler2, ivec2(gl_FragCoord.xy));
      #else
      highp float intensity =
          decodeBwTexture(texSampler1, texSampler2, fTexCoord);
      #endif

      if (maxGradient > ZERO_PLUS) intensity /= maxGradient;

      if (intensity > highThreshold) outputColor = 1.0;
      else if (intensity > lowThreshold) outputColor = LOW_THRES_INTENSITY;
      else discard;
      
      #ifndef WEBGL2
      gl_FragColor.r = outputColor;
      #endif
    }
  `
};
