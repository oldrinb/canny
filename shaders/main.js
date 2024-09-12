/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Render final images to the screen.
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 19, 2024
 **/

const mainShaders = {
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
    precision lowp int;
    precision mediump float;

    const vec3 EDGE_COLOR;
    const float IMAGE_WIDTH;
    const float IMAGE_HEIGHT;
    const float IMAGE_GAP;
    const float EPSILON;

    #ifdef WEBGL2
    out lowp vec4 outputColor;
    #endif

    uniform sampler2D leftTexSampler, rightTexSampler, edgeTexSampler;
    uniform bool isLeftColorTexture, isRightColorTexture;
    uniform bool isLeftOverlay, isRightOverlay;



    void main() {
      lowp vec3 color = vec3(1.0);
      lowp float edge = 0.0;

      // Left panel
      if (gl_FragCoord.x < IMAGE_WIDTH) {
        #ifdef WEBGL2
        ivec2 texelCoord = ivec2(gl_FragCoord.x, IMAGE_HEIGHT - gl_FragCoord.y);
        lowp vec3 texelColor = texelFetch(leftTexSampler, texelCoord, 0).rgb;
        color = isLeftColorTexture ? texelColor : texelColor.rrr;
        edge = texelFetch(edgeTexSampler, texelCoord, 0).r;
        #else
        vec2 textureCoord = vec2(gl_FragCoord.x / IMAGE_WIDTH,
                                 1.0 - gl_FragCoord.y / IMAGE_HEIGHT);
        lowp vec3 textureColor = texture2D(leftTexSampler, textureCoord).rgb;
        color = isLeftColorTexture ? textureColor : textureColor.rrr;  
        edge = texture2D(edgeTexSampler, textureCoord).r;
        #endif

        if (isLeftOverlay && edge > 1.0 - EPSILON) color = EDGE_COLOR;
      }

      // Right panel
      else if (gl_FragCoord.x > IMAGE_WIDTH + IMAGE_GAP) {
        #ifdef WEBGL2
        ivec2 texelCoord = ivec2(gl_FragCoord.x - IMAGE_WIDTH - IMAGE_GAP,
                                 IMAGE_HEIGHT - gl_FragCoord.y);
        lowp vec3 texelColor = texelFetch(rightTexSampler, texelCoord, 0).rgb;
        color = isRightColorTexture ? texelColor : texelColor.rrr;
        edge = texelFetch(edgeTexSampler, texelCoord, 0).r;
        #else
        vec2 textureCoord =
            vec2((gl_FragCoord.x - IMAGE_GAP) / IMAGE_WIDTH - 1.0,
            1.0 - gl_FragCoord.y / IMAGE_HEIGHT);
        lowp vec3 textureColor = texture2D(rightTexSampler, textureCoord).rgb;
        color = isRightColorTexture ? textureColor : textureColor.rrr;
        edge = texture2D(edgeTexSampler, textureCoord).r;
        #endif

        if (isRightOverlay && edge > 1.0 - EPSILON) color = EDGE_COLOR;
      }

      #ifdef WEBGL2
      outputColor = vec4(color, 1.0);
      #else
      gl_FragColor = vec4(color, 1.0);
      #endif
    }
  `
};
