/*<?xml version="1.0" encoding="utf-8"?>*/
 
const compareTexShaders = {
  vertexShader: `#version 300 es
    #define WEBGL2
    precision mediump float;

    #ifdef WEBGL2
    in vec3 vPosition;
    #else
    attribute vec3 vPosition; 
    #endif



    void main() {
      gl_Position = vec4(vPosition, 1.0);
    }
  `,




  fragmentShader: `#version 300 es
    #define WEBGL2
    precision mediump float;

    const float EPSILON;

    uniform sampler2D texSampler1, texSampler2;

    #ifdef WEBGL2
    out lowp float outputColor;
    #endif


        
    void main() {
      #ifdef WEBGL2
      lowp float image1 = texelFetch(texSampler1, ivec2(gl_FragCoord.xy), 0).r;
      lowp float image2 = texelFetch(texSampler2, ivec2(gl_FragCoord.xy), 0).r;

      lowp float difference = abs(image1 - image2);
      if (difference > EPSILON) outputColor = 1.0;
      else discard;
      #else
      texSampler1; texSampler2;
      #endif
    }		`
};
