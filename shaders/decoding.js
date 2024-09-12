/*<?xml version="1.0" encoding="utf-8"?>*/

/*
 * This fragment shader converts a pixel stored in a 16-bit format into 8-bit,
 * in order to be displayed.
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 20, 2024
*/

 const decodingShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const float FLOAT_MIN_VALUE;
    const float FLOAT_MAX_VALUE;

    uniform sampler2D texSampler1, texSampler2;
    uniform vec2 outputRange;
    uniform bool isColorTexture;

    highp float decode2Bytes(lowp vec2);

    #ifdef WEBGL2
    out lowp vec4 outputColor;

    highp vec3 decodeColorTexel(sampler2D, sampler2D, ivec2);
    highp float decodeBWTexel(sampler2D, sampler2D, ivec2);

    #else
    varying vec2 fTexCoord;

    highp vec3 decodeColorTexture(sampler2D, sampler2D, vec2);
    highp float decodeBWTexture(sampler2D, sampler2D, vec2);
    #endif



    void main() {
      if (isColorTexture) {
        #ifdef WEBGL2
        highp vec3 color =
            decodeColorTexel(texSampler1, texSampler2, ivec2(gl_FragCoord.xy));
        #else
        highp vec3 color =
            decodeColorTexture(texSampler1, texSampler2, fTexCoord);
        #endif

        color -= vec3(outputRange.x);
        color /= vec3(outputRange.y - outputRange.x);

        #ifdef WEBGL2
        outputColor.rgb = color;
        #else
        gl_FragColor.rgb = color;
        #endif
      }
      else {
        #ifdef WEBGL2
        highp float intensity =
            decodeBWTexel(texSampler1, texSampler2, ivec2(gl_FragCoord.xy));
        #else
        highp float intensity =
            decodeBWTexture(texSampler1, texSampler2, fTexCoord);
        #endif

        intensity -= outputRange.x;
        intensity /= (outputRange.y - outputRange.x);

        #ifdef WEBGL2
        outputColor.r = intensity;
        #else
        gl_FragColor.r = intensity;
        #endif
      }
    }
  `
};
