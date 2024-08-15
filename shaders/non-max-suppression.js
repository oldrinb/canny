/*<?xml version="1.0" encoding="utf-8"?>*/
 
const nonMaxSuppressionShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const int IMAGE_WIDTH;
    const int IMAGE_HEIGHT;
    const float FLOAT_MIN_VALUE;
    const float FLOAT_MAX_VALUE;
    const float PI;
    const float ZERO_PLUS;

    lowp vec2 encode2Bytes(highp float);
    highp float decode2Bytes(lowp vec2);
    void encodeBwOutput(highp float, out lowp float, out lowp float);

    const int ZERO = 0, DIR45 = 1, DIR90 = 2, DIR135 = 3, DIR180 = 4;

    uniform sampler2D texSampler1, texSampler2, angleTexSampler;

    #ifdef WEBGL2
    layout(location = 0) out lowp float outputColor1;
    layout(location = 1) out lowp float outputColor2;

    ivec2 getTexelCoord(int, int);
    highp float decodeBwTexel(sampler2D, sampler2D, ivec2);

    #else
    #extension GL_EXT_draw_buffers : require

    varying vec2 fTexCoord;

    vec2 getTextureCoord(int, int);
    highp float decodeBwTexture(sampler2D, sampler2D, vec2);
    #endif



    int getDirection(highp float gradient, highp float angle) {
      if (gradient > 0.0) {
        if (angle >= 7.0 * PI / 8.0) return DIR180;
        else if (angle >= 5.0 * PI / 8.0) return DIR135;
        else if (angle >= 3.0 * PI / 8.0) return DIR90;
        else if (angle >= PI / 8.0) return DIR45;
        else return DIR180;
      }
      else return ZERO;
    }



    void main() {
      #ifdef WEBGL2
      ivec2 texelCoord = ivec2(gl_FragCoord.xy);
      highp float gradient =
          decodeBwTexel(texSampler1, texSampler2, texelCoord);
      highp float angle = texelFetch(angleTexSampler, texelCoord, 0).r * PI;
      #else
      highp float gradient =
          decodeBwTexture(texSampler1, texSampler2, fTexCoord);
      highp float angle = texture2D(angleTexSampler, fTexCoord).r * PI;
      #endif

      if (gradient < ZERO_PLUS) gradient = 0.0;
      int direction = getDirection(gradient, angle);
      highp float gradient1 = 0.0, gradient2 = 0.0;

      ivec2 offset1 = ivec2(0), offset2 = ivec2(0);
      if (direction == DIR45) {
        offset1 = ivec2(1, 1);
        offset2 = ivec2(-1, -1);
      }
      else if (direction == DIR90) {
        offset1 = ivec2(0, 1);
        offset2 = ivec2(0, -1);
      }
      else if (direction == DIR135) {
        offset1 = ivec2(1, -1);
        offset2 = ivec2(-1, 1);
      }
      else if (direction == DIR180) {
        offset1 = ivec2(1, 0);
        offset2 = ivec2(-1, 0);
      }

      if (direction != ZERO) {
        #ifdef WEBGL2
        gradient1 = decodeBwTexel
            (texSampler1, texSampler2, getTexelCoord(offset1.x, offset1.y));
        gradient2 = decodeBwTexel
            (texSampler1, texSampler2, getTexelCoord(offset2.x, offset2.y));
        #else
        gradient1 = decodeBwTexture
            (texSampler1, texSampler2, getTextureCoord(offset1.x, offset1.y));
        gradient2 = decodeBwTexture
            (texSampler1, texSampler2, getTextureCoord(offset2.x, offset2.y));
        #endif
      }

      if (gradient < gradient1 || gradient < gradient2) gradient = 0.0;

      #ifdef WEBGL2
      encodeBwOutput(gradient, outputColor1, outputColor2);
      #else
      encodeBwOutput(gradient, gl_FragData[0].r, gl_FragData[1].r);
      #endif
    }
  `
};
