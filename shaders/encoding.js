/*<?xml version="1.0" encoding="utf-8"?>*/

/*
This fragment shader is converting an 8-bit image into a 16-bit format.
They are intended to store intermediate results between different steps of the
algorithm, in order to not lose precision.
*/

 const encodingShaders = {
  fragmentShader: `#version 300 es
    #define WEBGL2
    precision lowp int;
    precision mediump float;

    const float FLOAT_MIN_VALUE;
    const float FLOAT_MAX_VALUE;

    lowp vec2 encode2Bytes(highp float);
    void encodeColorOutput(highp vec3, out lowp vec3, out lowp vec3);
    void encodeBWOutput(highp float, out lowp float, out lowp float);

    uniform sampler2D texSampler;
    uniform bool isColorTexture;

    #ifdef WEBGL2
    layout(location = 0) out lowp vec4 outputColor1;
    layout(location = 1) out lowp vec4 outputColor2;

    #else
    #extension GL_EXT_draw_buffers : require

    varying vec2 fTexCoord;
    #endif



    void main() {
      if (isColorTexture) {
        #ifdef WEBGL2
        lowp vec3 color = texelFetch(texSampler, ivec2(gl_FragCoord.xy), 0).rgb;
        encodeColorOutput(color, outputColor1.rgb, outputColor2.rgb);
        #else
        lowp vec3 color = texture2D(texSampler, fTexCoord).rgb;
        encodeColorOutput(color, gl_FragData[0].rgb, gl_FragData[1].rgb);
        #endif
      }
      else {
        #ifdef WEBGL2
        lowp float intensity =
            texelFetch(texSampler, ivec2(gl_FragCoord.xy), 0).r;
        encodeBWOutput(intensity, outputColor1.r, outputColor2.r);
        #else
        lowp float intensity = texture2D(texSampler, fTexCoord).r;
        encodeBWOutput(intensity, gl_FragData[0].r, gl_FragData[1].r);
        #endif
      }
    }
  `
};
