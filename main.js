/*<?xml version="1.0" encoding="utf-8"?>*/

const IMAGE_WIDTH = 512, IMAGE_HEIGHT = 512, IMAGE_GAP = 10;
const IMAGE_PATH = "../common-files/images/";
const IMAGES = [["blurry-moon512", "png", "Blurry Moon", "bw"],
                ["einstein2", "png", "Einstein", "bw"],
                ["fruits", "png", "Fruits", "color"],
                ["head-ct", "png", "Head CT image", "bw"],
                ["house512", "png", "House", "bw"],
                ["lena", "png", "Lena", "color"],
                ["mandril", "png", "Mandril", "color"],
                ["monarch512", "png", "Monarch", "color"],
                ["noise-shape", "png", "Noise shape", "bw"],
                ["peppers", "png", "Peppers", "color"],
                ["steam-engine", "png", "Steam engine", "bw"],
                ["turbine-blade", "png", "Turbine blade", "bw"]];

const MODES = {INPUT: [0, "Input image"], 
               SMOOTHING: [1, "Step 1: Gaussian smoothing"],
               GRADIENT: [2, "Step 2: Magnitude of gradient"],
               NON_MAXIMUM: [3, "Step 3: Non-maximum suppression"],
               THRESHOLDING: [4, "Step 4: Hysteresis thresholding"],
               EDGE_LINKING: [5, "Step 5: Edge linking"]};

const PARAM = [[4, [7, 21]], [3, [8, 20]], [2, [9, 14]], [2, [5, 15]],
               [4, [4, 10]], [2, [7, 21]], [4, [10, 25]], [2, [5, 15]],
               [6, [10, 30]], [3, [5, 15]], [3, [8, 24]], [4, [15, 46]]];

const EDGE_COLOR = [0, 1, 0], LOW_THRES_INTENSITY = 0.4;
const FLOAT_MIN_VALUE = 0.0, FLOAT_MAX_VALUE = 2.5;



let html_, canvas_;
let gl_, lose_context_ext_, vao_ext_, draw_ext_;
let quad_, shaderManager_, textures_= [];
let smoothingFramebuffer_, gradientFramebuffer_, nonMaxFramebuffer_,
    thresholdingFramebuffer_, edgeLinkingFramebuffer_;
let framebuffer1_, framebuffer2_, framebuffer3_, framebuffer4_, framebuffer5_,
    framebuffer6_, framebuffer7_;
let currentImage_, currentLeftMode_, currentRightMode_, isLeftOverlay_,
    isRightOverlay_;
let timeout_, interval_, isError_;
let sliderDelay_, numMaxIter_, numIterTest_, maxGradient_;



function init() {
  currentImage_ = 0;

  currentLeftMode_ = Object.keys(MODES) [MODES.INPUT[0]];
  currentRightMode_ = Object.keys(MODES) [MODES.EDGE_LINKING[0]];
  isLeftOverlay_ = false; isRightOverlay_ = false; isError_ = false;
  sliderDelay_ = 200; numMaxIter_ = 1000; numIterTest_ = 100;

  html_ = new Html(IMAGES, MODES);
  let sigma = PARAM[currentImage_][0];
  let lowThreshold = PARAM[currentImage_][1][0];
  let highThreshold = PARAM[currentImage_][1][1];
  html_.init(currentImage_, sigma, [lowThreshold, highThreshold],
      [currentLeftMode_, currentRightMode_], [isLeftOverlay_, isRightOverlay_]);

  let page = document.getElementsByClassName("no-javascript")[0];
  page.className = "";

  handleException(null, null);
  html_.enableControls(false, false, false, true, false);
  html_.setInfo("Initializing ...");

  canvas_ = document.getElementById("gl-canvas");
  canvas_.width = 2 * IMAGE_WIDTH + IMAGE_GAP;
  canvas_.height = IMAGE_HEIGHT;  

  let attributes = {alpha: false, antialias: false, depth: false};  
  gl_ = canvas_.getContext("webgl2", attributes);

  if (!gl_) {
    gl_ = canvas_.getContext("webgl", attributes);
    if (gl_) {
      vao_ext_ = gl_.getExtension("OES_vertex_array_object");
      draw_ext_ = gl_.getExtension("WEBGL_draw_buffers");

      if (!draw_ext_) {
        handleException("webgl-ext",
            "Canny: 'WEBGL_draw_buffers' extension is not supported.");
        return;
      }
    }
    else {
      handleException("webgl", null);
      return;
    }
  }

  lose_context_ext_ = gl_.getExtension("WEBGL_lose_context");

  shaderManager_ = new ShaderManager([gl_], [IMAGE_WIDTH, IMAGE_HEIGHT,
      IMAGE_GAP], [EDGE_COLOR, LOW_THRES_INTENSITY], [FLOAT_MIN_VALUE,
      FLOAT_MAX_VALUE]);
  quad_ = new Mesh([gl_, vao_ext_], models.quad.positions, null,
      models.quad.texCoords);
  initTextures();

  Promise.all([shaderManager_.compilePrograms(), quad_.loadBuffers()])
    .then(function(values) {
      shaderManager_.setAttribPointers(quad_);

      let kernel = computeGaussianKernel(sigma);
      shaderManager_.setKernel(kernel);
      shaderManager_.setThresholds([html_.getLowThreshold(),
                                    html_.getHighThreshold()]);

      gl_.enable(gl_.CULL_FACE);
      gl_.clearColor(0.0, 0.0, 0.0, 1.0);

      let errorCode = gl_.getError();
      if (errorCode != gl_.NO_ERROR)
        throw (util.getGLErrorMessage(gl_, errorCode));

      createFramebuffers();
      if (!isError_) updateTexture();
    })
    .catch(function(error) {
      handleException("init", error);
    });
}



async function render(paramChanged) {
  try{
    if (paramChanged) {
      computeSmoothing();
      computeGradient();
      computeNonMaximum();
      computeThresholding();

      computeEdgeLinking()
      .then(function() {
        renderScene();

        let errorCode = gl_.getError();
        if (errorCode != gl_.NO_ERROR)
          throw (util.getGLErrorMessage(gl_, errorCode));

      })
      .catch(function(error) {
        handleException("render", error);
      });
    }
    else {
      renderScene();

      let errorCode = gl_.getError();
      if (errorCode != gl_.NO_ERROR)
        throw (util.getGLErrorMessage(gl_, errorCode));
    }
  }
  catch(error) {
    handleException("render", error);
  }
}



function clean() {
  deleteTextures();
  deleteFramebuffers();

  if (typeof quad_ !== "undefined") quad_.deleteBuffers();
  if (typeof shaderManager_ !== "undefined") shaderManager_.deletePrograms();

  if (typeof lose_context_ext_ !== "undefined" &&
             lose_context_ext_ !== null &&
             !gl_.isContextLost()) {
    lose_context_ext_.loseContext();
  }
}



function selectImage(event) {
  let name = event.target.value;
  for (let i = 0; i < IMAGES.length; i++)
    if (IMAGES[i][0] == name) {
      currentImage_ = i;
      break;
    }

  let sigma = PARAM[currentImage_][0];
  let lowThreshold = PARAM[currentImage_][1][0];
  let highThreshold = PARAM[currentImage_][1][1];
  html_.init(currentImage_, sigma, [lowThreshold, highThreshold],
      [currentLeftMode_, currentRightMode_], [isLeftOverlay_, isRightOverlay_]);

  deleteFramebuffers();
  createFramebuffers();

  if (!isError_) {
    let kernel = computeGaussianKernel(sigma);
    shaderManager_.setKernel(kernel, false);
    shaderManager_.setThresholds([html_.getLowThreshold(),
        html_.getHighThreshold()]);

    updateTexture();
  }
}



function setSmoothingValue(event) {
  let sigma = event.target.value;
  if (sigma < 0.5) sigma = 0;
  html_.setSmoothingValue(sigma);

  if (typeof timeout_ !== "undefined") 
    clearTimeout(timeout_);

  timeout_ = setTimeout(function() {
    let kernel = computeGaussianKernel(sigma);
    shaderManager_.setKernel(kernel);

    if (!isError_) render(true);
  }, sliderDelay_);
}



function setLowThreshold(event) {
  let lowThreshold = event.target.value;
  html_.setThresholds([lowThreshold, undefined]);

  if (typeof timeout_ !== "undefined")
    clearTimeout(timeout_);

  timeout_ = setTimeout(function() {
    shaderManager_.setThresholds([lowThreshold, html_.getHighThreshold()]);

    if (!isError_) render(true);
  }, sliderDelay_);
}



function setHighThreshold(event) {
  let highThreshold = event.target.value;
  html_.setThresholds([undefined, highThreshold]);

  if (typeof timeout_ !== "undefined")
    clearTimeout(timeout_);

  timeout_ = setTimeout(function() {
    shaderManager_.setThresholds([html_.getLowThreshold(), highThreshold]);

    if (!isError_) render(true);
  }, sliderDelay_);
}



function setThresholdRange(event) {
  let range = event.target.value;
  html_.setThresholdRange(range);

  shaderManager_.setThresholds([html_.getLowThreshold(),
     html_.getHighThreshold()]);
  if (!isError_) render(true);
}



function setLeftPanelMode(event) {
  let value = event.target.value;
  currentLeftMode_ = Object.keys(MODES) [value];
  html_.setPanelModes([currentLeftMode_, currentRightMode_]);

  if (!isError_) render(false);
}



function setRightPanelMode(event) {
  let value = event.target.value;
  currentRightMode_ = Object.keys(MODES) [value];
  html_.setPanelModes([currentLeftMode_, currentRightMode_]);

  if (!isError_) render(false);
}



function setLeftOverlay(event) {
  isLeftOverlay_ = event.target.checked;
  html_.setPanelModes([currentLeftMode_, currentRightMode_]);
  shaderManager_.setLeftOverlay(isLeftOverlay_);

  if (!isError_) render(false);
}



function setRightOverlay(event) {
  isRightOverlay_ = event.target.checked;
  html_.setPanelModes([currentLeftMode_, currentRightMode_]);
  shaderManager_.setRightOverlay(isRightOverlay_);

  if (!isError_) render(false);
}



function renderScene() {
  let leftTexture = textures_[currentImage_];
  let rightTexture = textures_[currentImage_];
  let edgeTexture = edgeLinkingFramebuffer_;
  let isLeftColor = IMAGES[currentImage_][3] == "color";
  let isRightColor = IMAGES[currentImage_][3] == "color";

  switch (currentLeftMode_) {
    case Object.keys(MODES) [MODES.SMOOTHING[0]]:
      leftTexture = smoothingFramebuffer_;
      break;
    case Object.keys(MODES) [MODES.GRADIENT[0]]:
      leftTexture = gradientFramebuffer_;
      isLeftColor = false;
      break;
    case Object.keys(MODES) [MODES.NON_MAXIMUM[0]]:
      leftTexture = nonMaxFramebuffer_;
      isLeftColor = false;
      break;
    case Object.keys(MODES) [MODES.THRESHOLDING[0]]:
      leftTexture = thresholdingFramebuffer_;
      isLeftColor = false;
      break;
    case Object.keys(MODES) [MODES.EDGE_LINKING[0]]:
      if (!isLeftOverlay_) {
        leftTexture = edgeLinkingFramebuffer_;
        isLeftColor = false;
      }
  }

  switch (currentRightMode_) {
    case Object.keys(MODES) [MODES.SMOOTHING[0]]:
      rightTexture = smoothingFramebuffer_;
      break;
    case Object.keys(MODES) [MODES.GRADIENT[0]]:
      rightTexture = gradientFramebuffer_;
      isRightColor = false;
      break;
    case Object.keys(MODES) [MODES.NON_MAXIMUM[0]]:
      rightTexture = nonMaxFramebuffer_;
      isRightColor = false;
      break;
    case Object.keys(MODES) [MODES.THRESHOLDING[0]]:
      rightTexture = thresholdingFramebuffer_;
      isRightColor = false;
      break;
    case Object.keys(MODES) [MODES.EDGE_LINKING[0]]:
      if (!isRightOverlay_) {
        rightTexture = edgeLinkingFramebuffer_;
        isRightColor = false;
      }
  }

  shaderManager_.setLeftColorMode(isLeftColor);
  shaderManager_.setRightColorMode(isRightColor);

  gl_.viewport(0, 0, canvas_.width, canvas_.height);
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.MAIN, quad_, [leftTexture, 0],
      [rightTexture, 0], [edgeTexture, 0]);
}



function updateTexture() {
  try {
    if (textures_[currentImage_].isComplete()) {
      if (typeof interval_ !== "undefined") {
        clearInterval(interval_);
        interval_ = undefined;
      }

      canvas_.style.display = "block";
      html_.enableControls(true, true, true, true, true);
      html_.clearInfo();

      render(true);
    }
    else if (typeof interval_ === "undefined") {
      canvas_.style.display = "none";
      html_.enableControls(true, false, false, true, false);
      html_.setInfo("Loading image ...");

      interval_ = setInterval(updateTexture , 100);
    }
  }
  catch(error) {
    if (typeof interval_ !== "undefined") clearInterval(interval_);
    handleException("texture", error);
  }
}



function computeSmoothing() {
  gl_.viewport(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  shaderManager_.setInputColorMode(IMAGES[currentImage_][3] == "color");

  framebuffer1_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.ENCODING, quad_,
      [textures_[currentImage_], 0], [], []);
  framebuffer1_.stopDrawing();

  framebuffer2_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.setVerticalSmoothing(false);
  shaderManager_.render(shaderManager_.SMOOTHING, quad_, [framebuffer1_, 0],
      [framebuffer1_, 1], []);
  framebuffer2_.stopDrawing();

  framebuffer1_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.setVerticalSmoothing(true);
  shaderManager_.render(shaderManager_.SMOOTHING, quad_, [framebuffer2_, 0],
      [framebuffer2_, 1], []);
  framebuffer1_.stopDrawing();

  shaderManager_.setOutputColorMode(IMAGES[currentImage_][3] == "color");
  shaderManager_.setOutputRange([0, 1]);

  smoothingFramebuffer_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.DECODING, quad_, [framebuffer1_, 0],
      [framebuffer1_, 1], []);
  smoothingFramebuffer_.stopDrawing();
}



function computeGradient() {
  gl_.viewport(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  shaderManager_.setInputColorMode(IMAGES[currentImage_][3] == "color");

  framebuffer3_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.GRADIENT, quad_, [framebuffer1_, 0],
      [framebuffer1_, 1], []);
  framebuffer3_.stopDrawing();

  let pixels1 = framebuffer3_.readPixels(0);
  let pixels2 = framebuffer3_.readPixels(1);

  let max = 0;
  for (let i = 0; i < pixels1.length; i++) {
    let value = pixels1[i] * 256 + pixels2[i];
    value = value / 65535.0  * (FLOAT_MAX_VALUE - FLOAT_MIN_VALUE) +
        FLOAT_MIN_VALUE;

    if (value > max) max = value;
  }
  maxGradient_ = max;

  shaderManager_.setOutputColorMode(false);
  shaderManager_.setOutputRange([FLOAT_MIN_VALUE, maxGradient_]);

  gradientFramebuffer_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.DECODING, quad_, [framebuffer3_, 0],
      [framebuffer3_, 1], []);
  gradientFramebuffer_.stopDrawing();
}



function computeNonMaximum() {
  gl_.viewport(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  framebuffer4_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.NON_MAXIMUM, quad_, [framebuffer3_, 0],
      [framebuffer3_, 1], [framebuffer3_, 2]);
  framebuffer4_.stopDrawing();

  shaderManager_.setOutputColorMode(false);
  shaderManager_.setOutputRange([FLOAT_MIN_VALUE, maxGradient_]);

  nonMaxFramebuffer_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.render(shaderManager_.DECODING, quad_, [framebuffer4_, 0],
      [framebuffer4_, 1], []);
  nonMaxFramebuffer_.stopDrawing();
}



function computeThresholding() {
  gl_.viewport(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  framebuffer5_.startDrawing();
  gl_.clear(gl_.COLOR_BUFFER_BIT);
  shaderManager_.setMaxGradient(maxGradient_);
  shaderManager_.render(shaderManager_.THRESHOLDING, quad_, [framebuffer4_, 0],
      [framebuffer4_, 1], []);
  framebuffer5_.stopDrawing();

  thresholdingFramebuffer_.copy(framebuffer5_);
}



function computeEdgeLinking() {
  gl_.viewport(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  return new Promise(function(resolve, reject) {
    setTimeout(async function() {
      try {
        let i = 0; let texturesEqual = false;

        do {
          framebuffer6_.startDrawing();
          gl_.clear(gl_.COLOR_BUFFER_BIT);
          shaderManager_.render(shaderManager_.EDGE_LINKING, quad_,
              [framebuffer5_, 0], [], []);
          framebuffer6_.stopDrawing();

          framebuffer5_.startDrawing();
          gl_.clear(gl_.COLOR_BUFFER_BIT);
          shaderManager_.render(shaderManager_.EDGE_LINKING, quad_,
              [framebuffer6_, 0], [], []);
          framebuffer5_.stopDrawing();

          if (i%numIterTest_ == (numIterTest_ - 1))
            texturesEqual = await compareTextures();

          i++;
        } while (i < numMaxIter_ && !texturesEqual);

        edgeLinkingFramebuffer_.startDrawing();
        gl_.clear(gl_.COLOR_BUFFER_BIT);
        shaderManager_.render(shaderManager_.CLEAN_UP, quad_,
          [framebuffer5_, 0], [], []);
        edgeLinkingFramebuffer_.stopDrawing();
        resolve();
      }
      catch (error) {
        reject(error);
      }
    }, 0);
  });
}



function computeGaussianKernel(sigma) {
  let kernel = [];

  if (sigma > 0) {
    let c = Math.ceil(6 * sigma);
    let w = c + (c%2 == 0);
    let halfW = (w - 1) / 2;

    let sum = 1;
    for (let i = 0; i <= halfW; i++) {
      kernel[i] = Math.exp(- Math.pow(i, 2) / 2 / Math.pow(sigma, 2));
      if (i > 0) sum += 2 * kernel[i];
    }
    for (let i = 0; i <= halfW; i++)
      kernel[i] = kernel[i] / sum;
  }
  else kernel = [1];
  return kernel;
}



function initTextures() {
  for (let i = 0; i < IMAGES.length; i++) {
    textures_[i] = new Texture([gl_], (IMAGES[i][3] == "color"), 1, 1, false,
        false, false);

    textures_[i].loadImage(IMAGE_PATH + IMAGES[i][0] + "." + IMAGES[i][1])
      .catch(function(error) {});
  }
}



function deleteTextures() {
  if (typeof textures_ !== "undefined")
    for (let i = 0; i < textures_.length; i++) 
      if (typeof textures_[i] !== "undefined") textures_[i].deleteTexture();
}



function createFramebuffers() {
  let isColor = (IMAGES[currentImage_][3] == "color");
  try {
    smoothingFramebuffer_ = new Framebuffer([gl_, draw_ext_], isColor,
        IMAGE_WIDTH, IMAGE_HEIGHT, 1, false, false);
    gradientFramebuffer_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 1, false, false);
    nonMaxFramebuffer_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 1, false, false);
    thresholdingFramebuffer_ = new Framebuffer([gl_, draw_ext_], false,
        IMAGE_WIDTH, IMAGE_HEIGHT, 1, false, false);
    edgeLinkingFramebuffer_ = new Framebuffer([gl_, draw_ext_], false,
        IMAGE_WIDTH, IMAGE_HEIGHT, 1, false, false);

    framebuffer1_ = new Framebuffer([gl_, draw_ext_], isColor, IMAGE_WIDTH,
        IMAGE_HEIGHT, 2, false, false);
    framebuffer2_ = new Framebuffer([gl_, draw_ext_], isColor, IMAGE_WIDTH,
        IMAGE_HEIGHT, 2, false, false);
    framebuffer3_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 3, false, false);
    framebuffer4_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 2, false, false);
    framebuffer5_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 1, false, false);
    framebuffer6_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 1, false, false);
    framebuffer7_ = new Framebuffer([gl_, draw_ext_], false, IMAGE_WIDTH,
        IMAGE_HEIGHT, 1, false, false);

    let errorCode = gl_.getError();
    if (errorCode != gl_.NO_ERROR) 
      throw (util.getGLErrorMessage(gl_, errorCode));
  }
  catch(error) {
    handleException("framebuffer", error);
  }
}



function deleteFramebuffers() {
  if (typeof smoothingFramebuffer_ !== "undefined")
    smoothingFramebuffer_.deleteFramebuffer();
  if (typeof gradientFramebuffer_ !== "undefined")
    gradientFramebuffer_.deleteFramebuffer();
  if (typeof nonMaxFramebuffer_ !== "undefined")
    nonMaxFramebuffer_.deleteFramebuffer();
  if (typeof thresholdingFramebuffer_ !== "undefined")
    thresholdingFramebuffer_.deleteFramebuffer();
  if (typeof edgeLinkingFramebuffer_ !== "undefined")
    edgeLinkingFramebuffer_.deleteFramebuffer();

  if (typeof framebuffer1_ !== "undefined") framebuffer1_.deleteFramebuffer();
  if (typeof framebuffer2_ !== "undefined") framebuffer2_.deleteFramebuffer();
  if (typeof framebuffer3_ !== "undefined") framebuffer3_.deleteFramebuffer();
  if (typeof framebuffer4_ !== "undefined") framebuffer4_.deleteFramebuffer();
  if (typeof framebuffer5_ !== "undefined") framebuffer5_.deleteFramebuffer();
  if (typeof framebuffer6_ !== "undefined") framebuffer6_.deleteFramebuffer();
  if (typeof framebuffer7_ !== "undefined") framebuffer7_.deleteFramebuffer();
}



function compareTextures() {
  let texturesEqual = true;
  return new Promise(function(resolve, reject) {
    if (gl_ instanceof WebGLRenderingContext) {
      setTimeout(function() {
        try {
          let pixels1 = framebuffer5_.readPixels(0);
          let pixels2 = framebuffer6_.readPixels(0);

          let i = 0;
          while (i < pixels1.length) {
            if (pixels1[i] != pixels2[i]) {
              texturesEqual = false;
              break;
            }
            i += 4;
          }

          resolve(texturesEqual);
        }
        catch (error) {
          reject(error);
        }
      }, 0);
    }
    else {
      let query = gl_.createQuery();

      framebuffer7_.startDrawing();
      gl_.clear(gl_.COLOR_BUFFER_BIT);
      gl_.beginQuery(gl_.ANY_SAMPLES_PASSED, query);
      shaderManager_.render(shaderManager_.COMPARE_TEX, quad_,
          [framebuffer5_, 0], [framebuffer6_, 0], []);
      gl_.endQuery(gl_.ANY_SAMPLES_PASSED);
      gl_.flush();
      framebuffer7_.stopDrawing();

      let interval = setInterval(function() {
        let ready = gl_.getQueryParameter(query, gl_.QUERY_RESULT_AVAILABLE);
        if (ready) {
          clearInterval(interval);
          let p = gl_.getQueryParameter(query, gl_.QUERY_RESULT);
          if (p > 0) texturesEqual = false;

          resolve(texturesEqual);
        }
      }, 0);
    }
  });
}



function handleException(errorCode, description) {
  if (errorCode) {
    isError_ = true;
    html_.clearInfo();
    html_.enableControls(false, false, false, false, false);

    if (typeof canvas_ !== "undefined")
      canvas_.style.display = "none";
    
    let message = util.getErrorMessage(errorCode);
    util.displayErrorMessage(message, description);
  }
  else util.displayErrorMessage(null, null);
}