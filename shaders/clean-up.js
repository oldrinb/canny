/*<?xml version="1.0" encoding="utf-8"?>*/

/*
Canny Edge Detector. Step 5b - Clean up.
If current pixel was not marked as 'strong' at step 5a (edge linking),
it is assumed to come from noise, and discarded.
*/

const cleanUpShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const float EPSILON;

    uniform sampler2D texSampler;

    #ifdef WEBGL2
    out lowp float outputColor;
    #else
    varying vec2 fTexCoord;

    lowp float outputColor;
    #endif



    void main() {
      #ifdef WEBGL2
      lowp float intensity =
          texelFetch(texSampler, ivec2(gl_FragCoord.xy), 0).r;
      #else
      lowp float intensity = texture2D(texSampler, fTexCoord).r;
      #endif

      if (intensity > 1.0 - EPSILON) outputColor = 1.0;
      else discard;

      #ifndef WEBGL2
      gl_FragColor.r = outputColor;
      #endif
    }
  `
};
