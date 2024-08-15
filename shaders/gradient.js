/*<?xml version="1.0" encoding="utf-8"?>*/

const gradientShaders = {
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

    uniform sampler2D texSampler1, texSampler2;
    uniform bool isColorTexture;

    lowp vec2 encode2Bytes(highp float);
    highp float decode2Bytes(lowp vec2);
    void encodeBwOutput(highp float, out lowp float, out lowp float);

    #ifdef WEBGL2
    layout(location = 0) out lowp float outputColor1;
    layout(location = 1) out lowp float outputColor2;
    layout(location = 2) out lowp float outputColor3;

    ivec2 getTexelCoord(int, int);
    highp vec3 decodeColorTexel(sampler2D, sampler2D, ivec2);
    highp float decodeBwTexel(sampler2D, sampler2D, ivec2);

    #else
    #extension GL_EXT_draw_buffers : require

    varying vec2 fTexCoord;

    vec2 getTextureCoord(int, int);
    highp vec3 decodeColorTexture(sampler2D, sampler2D, vec2);
    highp float decodeBwTexture(sampler2D, sampler2D, vec2);
    #endif



    highp vec3 computeColorGradient(bool isVertical) {
      #ifdef WEBGL2
      ivec2 texelCoord = isVertical ? getTexelCoord(1, 0) : getTexelCoord(0, 1);
      highp vec3 grad = decodeColorTexel(texSampler1, texSampler2, texelCoord); 
      texelCoord = isVertical ? getTexelCoord(-1, 0) : getTexelCoord(0, -1);
      grad -= decodeColorTexel(texSampler1, texSampler2, texelCoord);
      #else
      vec2 textureCoord =
          isVertical ? getTextureCoord(1, 0) : getTextureCoord(0, 1);
      highp vec3 grad =
          decodeColorTexture(texSampler1, texSampler2, textureCoord); 
      textureCoord =
          isVertical ? getTextureCoord(-1, 0) : getTextureCoord(0, -1);
      grad -= decodeColorTexture(texSampler1, texSampler2, textureCoord);
      #endif
      return grad;
    }



    highp float computeBwGradient(bool isVertical) {
      #ifdef WEBGL2
      ivec2 texelCoord =
          isVertical ? getTexelCoord(1, 0) : getTexelCoord(0, 1);
      highp float grad = decodeBwTexel(texSampler1, texSampler2, texelCoord); 
      texelCoord = isVertical ? getTexelCoord(-1, 0) : getTexelCoord(0, -1);
      grad -= decodeBwTexel(texSampler1, texSampler2, texelCoord);
      #else
      vec2 textureCoord =
          isVertical ? getTextureCoord(1, 0) : getTextureCoord(0, 1);
      highp float grad =
          decodeBwTexture(texSampler1, texSampler2, textureCoord); 
      textureCoord =
          isVertical ? getTextureCoord(-1, 0) : getTextureCoord(0, -1);
      grad -= decodeBwTexture(texSampler1, texSampler2, textureCoord);
      #endif
      return grad;
    }



    void main() {
      highp float gradient = 0.0, gradient2 = 0.0, angle = 0.0, angle2 = 0.0;

      if (isColorTexture) {
        highp vec3 gx = computeColorGradient(true);
        highp vec3 gy = computeColorGradient(false);
        highp float gxx, gyy, gxy;

        gxx = pow(gx.r, 2.0) + pow(gx.g, 2.0) + pow(gx.b, 2.0);
        gyy = pow(gy.r, 2.0) + pow(gy.g, 2.0) + pow(gy.b, 2.0);
        gxy = gx.r *  gy.r + gx.g *  gy.g + gx.b *  gy.b;

        if (abs(gxx - gyy) > ZERO_PLUS) {
          angle = 0.5 * atan(2.0 * gxy / (gxx - gyy));
        }
        else if (abs(gxy) > ZERO_PLUS) angle = sign(gxy) *  PI / 4.0;
        angle2 = angle + PI / 2.0;

        gradient = sqrt(max(0.0, 0.5 * ((gxx + gyy) +
            (gxx - gyy) * cos(2.0 * angle) + 2.0 * gxy * sin(2.0 * angle))));
        gradient2 = sqrt(max(0.0, 0.5 * ((gxx + gyy) +
            (gxx - gyy) * cos(2.0 * angle2) + 2.0 * gxy * sin(2.0 * angle2))));

        if (gradient2 > gradient) {
          gradient = gradient2;
          angle = angle2;
        }
      }

      else {
        highp float gx = computeBwGradient(true);
        highp float gy = computeBwGradient(false);

        gradient = sqrt(gx * gx + gy * gy);

        if (abs(gx) > ZERO_PLUS) angle = atan(gy / gx);
        else if (abs(gy) > ZERO_PLUS) angle = sign(gy) *  PI / 2.0;
      }

      if (angle < 0.0) angle += PI;

      #ifdef WEBGL2
      encodeBwOutput(gradient, outputColor1, outputColor2);
      outputColor3 = angle / PI;
      #else
      encodeBwOutput(gradient, gl_FragData[0].r, gl_FragData[1].r);
      gl_FragData[2].r = angle / PI;
      #endif
    }
  `
};
