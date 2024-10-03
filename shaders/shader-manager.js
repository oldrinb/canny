/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Interface between the JavaScript 'main.js' file and GLSL shaders.
 * Author: Oldrin Bărbulescu
 * Last modified: Sep 24, 2024
 **/

function ShaderManager([gl], [imageWidth, imageHeight, imageGap],
    [edgeColor, lowThresIntensity], [floatMinValue, floatMaxValue]) {
  const N_PROGRAMS = 10;

  this.MAIN = 0;
  this.SMOOTHING = 1;
  this.GRADIENT = 2;
  this.NON_MAXIMA = 3;
  this.THRESHOLDING = 4;
  this.EDGE_LINKING = 5;
  this.COMPARE_TEX = 6;
  this.CLEAN_UP = 7;
  this.ENCODING = 8;
  this.DECODING = 9;

  const MAX_KERNEL_SIZE = 31;
  const PI = 3.1415927;
  const EPSILON = 0.002;
  const ZERO_PLUS = 0.001;

  const EDGE_COLOR_TEXT = "const vec3 EDGE_COLOR;";
  const LOW_THRES_TEXT = "const float LOW_THRES_INTENSITY;";

  const IMAGE_W_INT_TEXT = "const int IMAGE_WIDTH;";
  const IMAGE_H_INT_TEXT = "const int IMAGE_HEIGHT;";
  const IMAGE_W_TEXT = "const float IMAGE_WIDTH;";
  const IMAGE_H_TEXT = "const float IMAGE_HEIGHT;";
  const IMAGE_GAP_TEXT = "const float IMAGE_GAP;";

  const MAX_KERNEL_SIZE_TEXT = "const int MAX_KERNEL_SIZE;";

  const FLOAT_MIN_TEXT = "const float FLOAT_MIN_VALUE;";
  const FLOAT_MAX_TEXT = "const float FLOAT_MAX_VALUE;";
  const PI_TEXT = "const float PI;";
  const EPSILON_TEXT = "const float EPSILON;";
  const ZERO_PLUS_TEXT = "const float ZERO_PLUS;";

  const GET_TEXTURE_COORD = "vec2 getTextureCoord(int, int);";
  const GET_TEXEL_COORD = "ivec2 getTexelCoord(int, int);";
  const ENCODE_2_BYTES = "lowp vec2 encode2Bytes(highp float);";
  const DECODE_2_BYTES = "highp float decode2Bytes(lowp vec2);";
  const ENCODE_COLOR_OUTPUT =
      "void encodeColorOutput(highp vec3, out lowp vec3, out lowp vec3);";
  const DECODE_COLOR_TEXTURE =
      "highp vec3 decodeColorTexture(sampler2D, sampler2D, vec2);";
  const DECODE_COLOR_TEXEL =
      "highp vec3 decodeColorTexel(sampler2D, sampler2D, ivec2);";
  const ENCODE_BW_OUTPUT =
      "void encodeBWOutput(highp float, out lowp float, out lowp float);";
  const DECODE_BW_TEXTURE =
      "highp float decodeBWTexture(sampler2D, sampler2D, vec2);";
  const DECODE_BW_TEXEL =
      "highp float decodeBWTexel(sampler2D, sampler2D, ivec2);";



  this.compilePrograms = function() {
    let promises = [];
    for (let i = 0; i < N_PROGRAMS; i++)
      promises.push(programs_[i].compile());

    return Promise.all(promises)
      .then(function(values) {
        for (let i = 0; i < N_PROGRAMS; i++) {
          vertexPositionArray_[i] = programs_[i].getAttribLocation("vPosition");

          if (gl instanceof WebGLRenderingContext &&
              i != this.MAIN && i != this.COMPARE_TEX) {
            texCoordArray_[i] = programs_[i].getAttribLocation("vTexCoord");
          }
          else texCoordArray_[i] = -1;
        }

        texSampler1Array_ =
            [programs_[this.MAIN].getUniformLocation("leftTexSampler"),
             programs_[this.SMOOTHING].getUniformLocation("texSampler1"),
             programs_[this.GRADIENT].getUniformLocation("texSampler1"),
             programs_[this.NON_MAXIMA].getUniformLocation("texSampler1"),
             programs_[this.THRESHOLDING].getUniformLocation("texSampler1"),
             programs_[this.EDGE_LINKING].getUniformLocation("texSampler"),
             null,
             programs_[this.CLEAN_UP].getUniformLocation("texSampler"),
             programs_[this.ENCODING].getUniformLocation("texSampler"),
             programs_[this.DECODING].getUniformLocation("texSampler1")];

        texSampler2Array_ =
            [programs_[this.MAIN].getUniformLocation("rightTexSampler"),
             programs_[this.SMOOTHING].getUniformLocation("texSampler2"),
             programs_[this.GRADIENT].getUniformLocation("texSampler2"),
             programs_[this.NON_MAXIMA].getUniformLocation("texSampler2"),
             programs_[this.THRESHOLDING].getUniformLocation("texSampler2"),
             null, null, null, null,
             programs_[this.DECODING].getUniformLocation("texSampler2")];

        if (!(gl instanceof WebGLRenderingContext)) {
            texSampler1Array_[this.COMPARE_TEX] =
              programs_[this.COMPARE_TEX].getUniformLocation("texSampler1");
            texSampler2Array_[this.COMPARE_TEX] =
              programs_[this.COMPARE_TEX].getUniformLocation("texSampler2");
        }

        texSampler3Array_ =
            [programs_[this.MAIN].getUniformLocation("edgeTexSampler"),
             null, null,
             programs_[this.NON_MAXIMA].getUniformLocation("angleTexSampler"),
             null, null, null, null, null, null];

        isColorTextureArray_ =
            [null,
             programs_[this.SMOOTHING].getUniformLocation("isColorTexture"),
             programs_[this.GRADIENT].getUniformLocation("isColorTexture"),
             null, null, null, null, null,                          
             programs_[this.ENCODING].getUniformLocation("isColorTexture"),
             programs_[this.DECODING].getUniformLocation("isColorTexture")];
        isLeftColorTexture_ =
            programs_[this.MAIN].getUniformLocation("isLeftColorTexture");
        isRightColorTexture_ =
            programs_[this.MAIN].getUniformLocation("isRightColorTexture");

        isLeftOverlay_ =
            programs_[this.MAIN].getUniformLocation("isLeftOverlay");
        isRightOverlay_ =
            programs_[this.MAIN].getUniformLocation("isRightOverlay");

        for (let i = 0; i < MAX_KERNEL_SIZE; i++) {
          kernel_[i] =
              programs_[this.SMOOTHING].getUniformLocation("kernel[" + i + "]");
        }
        kernelSize_= programs_[this.SMOOTHING].getUniformLocation("kernelSize");
        isVertical_= programs_[this.SMOOTHING].getUniformLocation("isVertical");

        outputRange_ =
            programs_[this.DECODING].getUniformLocation("outputRange");
        maxGradient_ =
            programs_[this.THRESHOLDING].getUniformLocation("maxGradient");
        lowThreshold_ =
            programs_[this.THRESHOLDING].getUniformLocation("lowThreshold");
        highThreshold_ =
            programs_[this.THRESHOLDING].getUniformLocation("highThreshold");
      }.bind(this));
  };



  this.setAttribPointers = function(mesh) {
    for (let i = 0; i < N_PROGRAMS; i++) {
      mesh.setAttribPointers(programs_[i].program, 
          vertexPositionArray_[i], -1, texCoordArray_[i]);
    }
  };



  this.render = function(programId, mesh, [framebuffer1, attachment1],
      [framebuffer2, attachment2], [framebuffer3, attachment3]) {
    programs_[programId].start();

    let textureUnit = 0;
    programs_[programId].setUniformi(texSampler1Array_[programId], textureUnit);
    if (framebuffer1 instanceof Texture)
      framebuffer1.startReading(textureUnit);
    else framebuffer1.startReading(attachment1, textureUnit);

    if (typeof framebuffer2 !== "undefined" && texSampler2Array_[programId]) {
      textureUnit = 1;
      programs_[programId].setUniformi
          (texSampler2Array_[programId], textureUnit);
      if (framebuffer2 instanceof Texture)
        framebuffer2.startReading(textureUnit);
      else framebuffer2.startReading(attachment2, textureUnit);
    }

    if (typeof framebuffer3 !== "undefined" && texSampler3Array_[programId]) {
      textureUnit = 2;
      programs_[programId].setUniformi
          (texSampler3Array_[programId], textureUnit);
      if (framebuffer3 instanceof Texture)
        framebuffer3.startReading(textureUnit);
      else framebuffer3.startReading(attachment3, textureUnit);
    }

    mesh.render(programs_[programId].program,
        vertexPositionArray_[programId], -1, texCoordArray_[programId]);

    framebuffer1.stopReading();
    if (typeof framebuffer2 !== "undefined") framebuffer2.stopReading();
    if (typeof framebuffer3 !== "undefined") framebuffer3.stopReading();

    programs_[programId].stop();
  };



  this.deletePrograms = function() {
    for (let i = 0; i < N_PROGRAMS; i++)
      if (typeof programs_[i] !== "undefined")
        programs_[i].deleteProgram();
  };



  this.setInputColorMode = function(isColor) {
    programs_[this.SMOOTHING].start();
    programs_[this.SMOOTHING].setUniformui
        (isColorTextureArray_[this.SMOOTHING], isColor);

    programs_[this.GRADIENT].start();
    programs_[this.GRADIENT].setUniformui
        (isColorTextureArray_[this.GRADIENT], isColor);

    programs_[this.ENCODING].start();
    programs_[this.ENCODING].setUniformui
        (isColorTextureArray_[this.ENCODING], isColor);

    programs_[this.SMOOTHING].stop();
  };



  this.setOutputColorMode = function(isColor) {
    programs_[this.DECODING].start();
    programs_[this.DECODING].setUniformui
        (isColorTextureArray_[this.DECODING], isColor);
    programs_[this.DECODING].stop();
  };



  this.setLeftColorMode = function(isColor) {
    programs_[this.MAIN].start();
    programs_[this.MAIN].setUniformui(isLeftColorTexture_, isColor);
    programs_[this.MAIN].stop();
  };



  this.setRightColorMode = function(isColor) {
    programs_[this.MAIN].start();
    programs_[this.MAIN].setUniformui(isRightColorTexture_, isColor);
    programs_[this.MAIN].stop();
  };



  this.setLeftOverlay = function(isOverlay) {
    programs_[this.MAIN].start();
    programs_[this.MAIN].setUniformui(isLeftOverlay_, isOverlay);
    programs_[this.MAIN].stop();
  };



  this.setRightOverlay = function(isOverlay) {
    programs_[this.MAIN].start();
    programs_[this.MAIN].setUniformui(isRightOverlay_, isOverlay);
    programs_[this.MAIN].stop();
  };



  this.setKernel = function(kernel) {
    programs_[this.SMOOTHING].start();
    for (let i = 0; i < kernel.length && i < MAX_KERNEL_SIZE; i++)
      programs_[this.SMOOTHING].setUniformf(kernel_[i], kernel[i]);
    programs_[this.SMOOTHING].setUniformi(kernelSize_, kernel.length);
    programs_[this.SMOOTHING].stop();
  };



  this.setVerticalSmoothing = function(isVertical) {
    programs_[this.SMOOTHING].start();
    programs_[this.SMOOTHING].setUniformui(isVertical_, isVertical);
    programs_[this.SMOOTHING].stop();
  };



  this.setThresholds = function([lowThreshold, highThreshold]) {
    programs_[this.THRESHOLDING].start();
    programs_[this.THRESHOLDING].setUniformf(lowThreshold_, lowThreshold / 100);
    programs_[this.THRESHOLDING].setUniformf(highThreshold_, highThreshold/100);
    programs_[this.THRESHOLDING].stop();
  };



  this.setMaxGradient = function(value) {
    programs_[this.THRESHOLDING].start();
    programs_[this.THRESHOLDING].setUniformf(maxGradient_, value);
    programs_[this.THRESHOLDING].stop();
  };



  this.setOutputRange = function([min, max]) {
    programs_[this.DECODING].start();
    programs_[this.DECODING].setUniformVector2f(outputRange_, [min, max]);
    programs_[this.DECODING].stop();
  };



  const vertShaders_ = [mainShaders.vertexShader, shaderUtil.vertexShader,
                        shaderUtil.vertexShader, shaderUtil.vertexShader,
                        shaderUtil.vertexShader, shaderUtil.vertexShader,
                        compareTexShaders.vertexShader, shaderUtil.vertexShader, 
                        shaderUtil.vertexShader, shaderUtil.vertexShader];

  const fragShaders_ =
      [mainShaders.fragmentShader, smoothingShaders.fragmentShader,
       gradientShaders.fragmentShader, nonMaxSuppressionShaders.fragmentShader,
       thresholdingShaders.fragmentShader, edgeLinkingShaders.fragmentShader,
       compareTexShaders.fragmentShader, cleanUpShaders.fragmentShader,
       encodingShaders.fragmentShader, decodingShaders.fragmentShader];

  for (let i = 0; i < N_PROGRAMS; i++) {
    fragShaders_[i] = fragShaders_[i].replace(EDGE_COLOR_TEXT,
        EDGE_COLOR_TEXT.replace(";", " = vec3(" + edgeColor[0] +  ", " +
        edgeColor[1] + ", " + edgeColor[2] + ");"));

    fragShaders_[i] = fragShaders_[i].replace(LOW_THRES_TEXT,
        LOW_THRES_TEXT.replace(";", " = " + lowThresIntensity + ";"));

    fragShaders_[i] = fragShaders_[i].replace(IMAGE_W_INT_TEXT,
        IMAGE_W_INT_TEXT.replace(";", " = " + Math.round(imageWidth) + ";"));
    fragShaders_[i] = fragShaders_[i].replace(IMAGE_H_INT_TEXT,
        IMAGE_H_INT_TEXT.replace(";", " = " + Math.round(imageHeight) + ";"));
    fragShaders_[i] = fragShaders_[i].replace(IMAGE_W_TEXT,
        IMAGE_W_TEXT.replace(";", " = " + Math.round(imageWidth) + ".0;"));
    fragShaders_[i] = fragShaders_[i].replace(IMAGE_H_TEXT,
        IMAGE_H_TEXT.replace(";", " = " + Math.round(imageHeight) + ".0;"));
    fragShaders_[i] = fragShaders_[i].replace(IMAGE_GAP_TEXT,
        IMAGE_GAP_TEXT.replace(";", " = " + Math.round(imageGap) + ".0;"));

    fragShaders_[i] = fragShaders_[i].replace(MAX_KERNEL_SIZE_TEXT,
        MAX_KERNEL_SIZE_TEXT.replace(";", " = " + MAX_KERNEL_SIZE + ";"));

    fragShaders_[i] = fragShaders_[i].replace(FLOAT_MIN_TEXT,
        FLOAT_MIN_TEXT.replace(";", " = " + floatMinValue.toFixed(1) + ";"));
    fragShaders_[i] = fragShaders_[i].replace(FLOAT_MAX_TEXT,
        FLOAT_MAX_TEXT.replace(";", " = " + floatMaxValue.toFixed(1) + ";"));
    fragShaders_[i] = fragShaders_[i].replace(PI_TEXT, PI_TEXT.replace(";",
        " = " + PI + ";"));
    fragShaders_[i] = fragShaders_[i].replace
        (EPSILON_TEXT, EPSILON_TEXT.replace(";", " = " + EPSILON + ";"));
    fragShaders_[i] = fragShaders_[i].replace(ZERO_PLUS_TEXT,
        ZERO_PLUS_TEXT.replace(";", " = " + ZERO_PLUS + ";"));

    fragShaders_[i] =
        fragShaders_[i].replace(GET_TEXTURE_COORD, shaderUtil.getTextureCoord);
    fragShaders_[i] =
        fragShaders_[i].replace(GET_TEXEL_COORD, shaderUtil.getTexelCoord);
    fragShaders_[i] =
        fragShaders_[i].replace(ENCODE_2_BYTES, shaderUtil.encode2Bytes);
    fragShaders_[i] =
        fragShaders_[i].replace(DECODE_2_BYTES, shaderUtil.decode2Bytes);
    fragShaders_[i] =
        fragShaders_[i].replace(ENCODE_COLOR_OUTPUT,
        shaderUtil.encodeColorOutput);
    fragShaders_[i] =
        fragShaders_[i].replace(DECODE_COLOR_TEXTURE,
        shaderUtil.decodeColorTexture);
    fragShaders_[i] =
        fragShaders_[i].replace(DECODE_COLOR_TEXEL,
        shaderUtil.decodeColorTexel);
    fragShaders_[i] =
        fragShaders_[i].replace(ENCODE_BW_OUTPUT, shaderUtil.encodeBWOutput);
    fragShaders_[i] =
        fragShaders_[i].replace(DECODE_BW_TEXTURE, shaderUtil.decodeBWTexture);
    fragShaders_[i] =
        fragShaders_[i].replace(DECODE_BW_TEXEL, shaderUtil.decodeBWTexel);

    if (gl instanceof WebGLRenderingContext) {
      vertShaders_[i] =
          vertShaders_[i].replace("#version 300 es", "#version 100");
      vertShaders_[i] =
          vertShaders_[i].replace("#define WEBGL2", "#define WEBGL");
      fragShaders_[i] =
          fragShaders_[i].replace("#version 300 es", "#version 100");
      fragShaders_[i] =
          fragShaders_[i].replace("#define WEBGL2", "#define WEBGL");
    }
  }

  const programs_ = [];
  for (let i = 0; i < N_PROGRAMS; i++) 
    programs_[i] =  new Program([gl], vertShaders_[i], fragShaders_[i]);

  let vertexPositionArray_ = [];
  let texCoordArray_ = [];

  let texSampler1Array_, texSampler2Array_, texSampler3Array_;
  let isColorTextureArray_;
  let isLeftColorTexture_, isRightColorTexture_;
  let isLeftOverlay_, isRightOverlay_;

  let kernel_ = new Array(MAX_KERNEL_SIZE);
  let kernelSize_, isVertical_;
  let outputRange_, maxGradient_, lowThreshold_, highThreshold_;
}
