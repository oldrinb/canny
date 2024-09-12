/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Canny Edge Detector. Step 1 - Image smoothing with a Gaussian filter.
 * This shader convolves the current pixel with an 1-D Gaussian kernel. It is
 * called twice: first, in the horizontal direction, then in the vertical
 * direction, using the separability property of the Gaussian.
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 20, 2024
 **/

 const smoothingShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const int IMAGE_WIDTH;
    const int IMAGE_HEIGHT;
    const int MAX_KERNEL_SIZE;
    const float FLOAT_MIN_VALUE;
    const float FLOAT_MAX_VALUE;

    highp float decode2Bytes(lowp vec2);
    lowp vec2 encode2Bytes(highp float);
    void encodeColorOutput(highp vec3, out lowp vec3, out lowp vec3);
    void encodeBWOutput(highp float, out lowp float, out lowp float);

    uniform sampler2D texSampler1, texSampler2;
    uniform float kernel[MAX_KERNEL_SIZE];
    uniform int kernelSize;
    uniform bool isColorTexture, isVertical;

    #ifdef WEBGL2
    layout(location = 0) out lowp vec4 outputColor1;
    layout(location = 1) out lowp vec4 outputColor2;

    ivec2 getTexelCoord(int, int);
    highp vec3 decodeColorTexel(sampler2D, sampler2D, ivec2);
    highp float decodeBWTexel(sampler2D, sampler2D, ivec2);

    #else
    #extension GL_EXT_draw_buffers : require

    varying vec2 fTexCoord;

    vec2 getTextureCoord(int, int);
    highp vec3 decodeColorTexture(sampler2D, sampler2D, vec2);
    highp float decodeBWTexture(sampler2D, sampler2D, vec2);
    #endif



    // Convolution with 1-D kernel for color images.
    highp vec3 computeRGBSmoothing() {
      #ifdef WEBGL2
      ivec2 texelCoord = getTexelCoord(0, 0);
      highp vec3 color = decodeColorTexel(texSampler1, texSampler2, texelCoord);
      if (kernelSize > 0) color *= kernel[0];

      for (int i = 1; i < kernelSize; i++) {
        texelCoord = (isVertical) ? getTexelCoord(i, 0) : getTexelCoord(0, i);
        color +=
            decodeColorTexel(texSampler1, texSampler2, texelCoord) * kernel[i];

        texelCoord = (isVertical) ? getTexelCoord(-i, 0) : getTexelCoord(0, -i);
        color +=
            decodeColorTexel(texSampler1, texSampler2, texelCoord) * kernel[i];
      }

      #else
      vec2 textureCoord = getTextureCoord(0, 0);
      highp vec3 color =
          decodeColorTexture(texSampler1, texSampler2, textureCoord);
      if (kernelSize > 0) color *= kernel[0];

      for (int i = 1; i < MAX_KERNEL_SIZE; i++) {
        if (i >= kernelSize) break;

        textureCoord =
            (isVertical) ? getTextureCoord(i, 0) : getTextureCoord(0, i);
        color += decodeColorTexture(texSampler1, texSampler2, textureCoord) *
            kernel[i];

        textureCoord =
            (isVertical) ? getTextureCoord(-i, 0) : getTextureCoord(0, -i);
        color += decodeColorTexture(texSampler1, texSampler2, textureCoord) *
            kernel[i];
      }
      #endif

      return color;
    }



    // Convolution with 1-D kernel for monochrome images.
    highp float computeBWSmoothing() {
      #ifdef WEBGL2
      ivec2 texelCoord = getTexelCoord(0, 0);
      highp float intensity =
          decodeBWTexel(texSampler1, texSampler2, texelCoord);
      if (kernelSize > 0) intensity *= kernel[0];

      for (int i = 1; i < kernelSize; i++) {
        texelCoord = (isVertical) ? getTexelCoord(i, 0) : getTexelCoord(0, i);
        intensity +=
            decodeBWTexel(texSampler1, texSampler2, texelCoord) * kernel[i];

        texelCoord =
            (isVertical) ? getTexelCoord(-i, 0) : getTexelCoord(0, -i);
        intensity +=
            decodeBWTexel(texSampler1, texSampler2, texelCoord) * kernel[i];
      }

      #else
      vec2 textureCoord = getTextureCoord(0, 0);
      highp float intensity =
          decodeBWTexture(texSampler1, texSampler2, textureCoord);
      if (kernelSize > 0) intensity *= kernel[0];

      for (int i = 1; i < MAX_KERNEL_SIZE; i++) {
        if (i >= kernelSize) break;

        textureCoord =
            (isVertical) ? getTextureCoord(i, 0) : getTextureCoord(0, i);
        intensity +=
            decodeBWTexture(texSampler1, texSampler2, textureCoord) * kernel[i];

        textureCoord =
            (isVertical) ? getTextureCoord(-i, 0) : getTextureCoord(0, -i);
        intensity +=
            decodeBWTexture(texSampler1, texSampler2, textureCoord) * kernel[i];
      }
      #endif

      return intensity;
    }



    void main() {
      if (isColorTexture) {
        // Convolution with 1-D kernel for color images.
        highp vec3 color = computeRGBSmoothing();

        // Export the result in a 16 bit format.
        #ifdef WEBGL2
        encodeColorOutput(color, outputColor1.rgb, outputColor2.rgb);
        #else
        encodeColorOutput(color, gl_FragData[0].rgb, gl_FragData[1].rgb);
        #endif
      }
      else {
        // Convolution with 1-D kernel for monochrome images.
        highp float intensity = computeBWSmoothing();

        // Export the result in 16 a bit format.
        #ifdef WEBGL2
        encodeBWOutput(intensity, outputColor1.r, outputColor2.r);
        #else
        encodeBWOutput(intensity, gl_FragData[0].r, gl_FragData[1].r);
        #endif
      }
    }
  `
};
