/*<?xml version="1.0" encoding="utf-8"?>*/
/* Utility functions needed in different GLSL shaders. */

 const shaderUtil = {
  vertexShader: `#version 300 es
    #define WEBGL2
    precision mediump float;

    #ifdef WEBGL2
    in vec3 vPosition;
    #else
    attribute vec3 vPosition; 
    attribute vec2 vTexCoord;

    varying vec2 fTexCoord;
    #endif



    void main() {
      gl_Position = vec4(vPosition, 1.0);
      #ifndef WEBGL2
      fTexCoord = vTexCoord;
      #endif
    }
  `,




  getTextureCoord: `

    vec2 getTextureCoord(int offsetX, int offsetY) {
      return fTexCoord +
          vec2(offsetY, offsetX) / vec2(IMAGE_HEIGHT, IMAGE_WIDTH);
    }
  `,




  getTexelCoord: `

    ivec2 getTexelCoord(int offsetX, int offsetY) {
      ivec2 texCoord = ivec2(gl_FragCoord.xy) + ivec2(offsetY, offsetX);

      if (texCoord.x < 0) texCoord.x = 0;
      else if (texCoord.x > IMAGE_WIDTH - 1) texCoord.x = IMAGE_WIDTH - 1;

      if (texCoord.y < 0) texCoord.y = 0;
      else if (texCoord.y > IMAGE_HEIGHT - 1) texCoord.y = IMAGE_HEIGHT - 1;

      return texCoord;
    }
  `,




  decode2Bytes: `

    highp float decode2Bytes(lowp vec2 value) {
      #ifdef WEBGL2
      highp float intValue = round(value.x * 65280.0 + value.y * 255.0);
      #else
      highp float intValue = floor(value.x * 65280.0 + value.y * 255.0 + 0.5);
      #endif

      return intValue / 65535.0  *
          (FLOAT_MAX_VALUE - FLOAT_MIN_VALUE) + FLOAT_MIN_VALUE;
    }
  `,




  encode2Bytes: `

    lowp vec2 encode2Bytes(highp float value) {
      highp float normValue =
          (value - FLOAT_MIN_VALUE) / (FLOAT_MAX_VALUE - FLOAT_MIN_VALUE);
      #ifdef WEBGL2
      highp float intValue = round(normValue * 65535.0);
      #else
      highp float intValue = floor(normValue * 65535.0 + 0.5);
      #endif

      highp float byte1 = floor(intValue / 256.0);
      highp float byte2 = intValue - byte1 * 256.0;
      return vec2(byte1, byte2) / 255.0;
    }
  `,




  decodeColorTexture: `

    highp vec3 decodeColorTexture
        (sampler2D texSampler1, sampler2D texSampler2, vec2 textureCoord) {
      #ifdef WEBGL2
      lowp vec3 color1 = texture(texSampler1, textureCoord).rgb;
      lowp vec3 color2 = texture(texSampler2, textureCoord).rgb;
      #else
      lowp vec3 color1 = texture2D(texSampler1, textureCoord).rgb;
      lowp vec3 color2 = texture2D(texSampler2, textureCoord).rgb;
      #endif

      highp float red = decode2Bytes(vec2(color1.r, color2.r));
      highp float green = decode2Bytes(vec2(color1.g, color2.g));
      highp float blue = decode2Bytes(vec2(color1.b, color2.b));

      return vec3(red, green, blue);
    }
  `,




  decodeColorTexel: `

    highp vec3 decodeColorTexel
        (sampler2D texSampler1, sampler2D texSampler2, ivec2 texelCoord) {
      lowp vec3 color1 = vec3(0.0);
      lowp vec3 color2 = vec3(0.0);
      #ifdef WEBGL2
      color1 = texelFetch(texSampler1, texelCoord, 0).rgb;
      color2 = texelFetch(texSampler2, texelCoord, 0).rgb;

      highp float red = decode2Bytes(vec2(color1.r, color2.r));
      highp float green = decode2Bytes(vec2(color1.g, color2.g));
      highp float blue = decode2Bytes(vec2(color1.b, color2.b));
      #endif
      return vec3(red, green, blue);
    }
  `,




  decodeBWTexture: `

    highp float decodeBWTexture
        (sampler2D texSampler1, sampler2D texSampler2, vec2 textureCoord) {
      #ifdef WEBGL2
      lowp float intensity1 = texture(texSampler1, textureCoord).r;
      lowp float intensity2 = texture(texSampler2, textureCoord).r;
      #else
      lowp float intensity1 = texture2D(texSampler1, textureCoord).r;
      lowp float intensity2 = texture2D(texSampler2, textureCoord).r;
      #endif

      return decode2Bytes(vec2(intensity1, intensity2));
    }
  `,




  decodeBWTexel: `

    highp float decodeBWTexel
        (sampler2D texSampler1, sampler2D texSampler2, ivec2 texelCoord) {
      lowp float intensity1 = 0.0;
      lowp float intensity2 = 0.0;
      #ifdef WEBGL2
      intensity1 = texelFetch(texSampler1, texelCoord, 0).r;
      intensity2 = texelFetch(texSampler2, texelCoord, 0).r;
      #endif
      return decode2Bytes(vec2(intensity1, intensity2));
    }
  `,




  encodeColorOutput: `

    void encodeColorOutput(highp vec3 color,
        out lowp vec3 outputColor1, out lowp vec3 outputColor2) {
      lowp vec2 red = encode2Bytes(color.r);
      lowp vec2 green = encode2Bytes(color.g);
      lowp vec2 blue = encode2Bytes(color.b);

      outputColor1 = vec3(red.x, green.x, blue.x);
      outputColor2 = vec3(red.y, green.y, blue.y);
    }
  `,




  encodeBWOutput: `

    void encodeBWOutput
        (highp float intensity, out lowp float output1, out lowp float output2){
      lowp vec2 value = encode2Bytes(intensity);
    
      output1 = value.x;
      output2 = value.y;
    }
  `
};
