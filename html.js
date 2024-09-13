/*<?xml version="1.0" encoding="utf-8"?>*/

/**
 * Interface between JavaScript 'main.js' file and 'index.html' file.
 * Author: Oldrin Bărbulescu
 * Last modified: Aug 30, 2024
 **/

function Html(images, modes) {
  const FULL_RANGE = 100, HALF_RANGE = 50, QUARTER_RANGE = 25;

  const html_ = {
    selectImage: "select-image",

    smoothing: "gauss-smoothing",
    smoothingValue: "smoothing-value",

    thresholding: "thresholding",
    lowThreshold: "low-threshold",
    highThreshold: "high-threshold",
    lowThresValue: "low-thres-value",
    highThresValue: "high-thres-value",

    rangeLimit: "range-limit",
    rangeLimit25 : "range-limit-25",
    rangeLimit50 : "range-limit-50",
    rangeLimit100 : "range-limit-100",

    rangeTicks25: "range-ticks-25",
    rangeTicks50: "range-ticks-50",
    rangeTicks100: "range-ticks-100",

    rangeTicksVal25: "range-ticks-val-25",
    rangeTicksVal50: "range-ticks-val-50",
    rangeTicksVal100: "range-ticks-val-100",

    stepMain: "step-main",
    stepLeft: "step-left",
    stepRight: "step-right",
    overlayMain: "overlay-main",
    overlayLeft: "overlay-left",
    overlayRight: "overlay-right",

    info: "info"
  };

  const selectImage_ = document.getElementById(html_.selectImage);

  const smoothingInput_ = document.getElementById(html_.smoothing);
  const smoothingLabel_ = document.getElementById(html_.smoothingValue);

  const lowThresholdInput_ = document.getElementById(html_.lowThreshold);
  const highThresholdInput_ = document.getElementById(html_.highThreshold);
  const lowThresholdLabel_ = document.getElementById(html_.lowThresValue);
  const highThresholdLabel_ = document.getElementById(html_.highThresValue);

  const rangeLimit25Input_ = document.getElementById(html_.rangeLimit25);
  const rangeLimit50Input_ = document.getElementById(html_.rangeLimit50);
  const rangeLimit100Input_ = document.getElementById(html_.rangeLimit100);

  const rangeTicks25Div_ = document.getElementById(html_.rangeTicksVal25);
  const rangeTicks50Div_ = document.getElementById(html_.rangeTicksVal50);
  const rangeTicks100Div_ = document.getElementById(html_.rangeTicksVal100);

  const stepMainSelect_ = document.getElementById(html_.stepMain);
  const stepLeftSelect_ = document.getElementById(html_.stepLeft);
  const stepRightSelect_ = document.getElementById(html_.stepRight);

  const overlayMainInput_ = document.getElementById(html_.overlayMain);
  const overlayLeftInput_ = document.getElementById(html_.overlayLeft);
  const overlayRightInput_ = document.getElementById(html_.overlayRight);

  const infoTextAreas_ = [];

  let isSmoothingEnabled_ = isThresholdingEnabled_ = false;



  this.init = function(currentImage, sigma, [lowThreshold, highThreshold],
      [leftStepMode, rightStepMode], [isLeftOverlay, isRightOverlay]) {
    for (let i = selectImage_.options.length - 1; i >= 0; i--)
      selectImage_.remove(i);

    for (let i = 0; i < images.length; i++) {
      let option = document.createElement("option");
      option.value = images[i][0];
      option.text = images[i][2];
      selectImage_.add(option);
    }
    selectImage_.selectedIndex = currentImage;

    smoothingInput_.value = sigma;
    this.setSmoothingValue(sigma);

    lowThresholdInput_.max = FULL_RANGE;
    highThresholdInput_.max = FULL_RANGE;
    lowThresholdInput_.value = lowThreshold;
    highThresholdInput_.value = highThreshold;
    this.setThresholds([lowThreshold, highThreshold]);

    if (highThresholdInput_.value > HALF_RANGE) {
      rangeLimit100Input_.checked = true;
      this.setThresholdRange(html_.rangeLimit100);
    }
    else if (highThresholdInput_.value > QUARTER_RANGE) {
      rangeLimit50Input_.checked = true;
      this.setThresholdRange(html_.rangeLimit50);
    }
    else {
      rangeLimit25Input_.checked = true;
      this.setThresholdRange(html_.rangeLimit25);
    }

    for (let i = stepMainSelect_.options.length - 1; i >= 0; i--)
      stepMainSelect_.remove(i);
    for (let i = stepLeftSelect_.options.length - 1; i >= 0; i--)
      stepLeftSelect_.remove(i);
    for (let i = stepRightSelect_.options.length - 1; i >= 0; i--)
      stepRightSelect_.remove(i);

    for (let i = 0; i < Object.keys(modes).length; i++) {
      let option = document.createElement("option");
      option.value = Object.values(modes)[i][0];
      option.text = Object.values(modes)[i][1];
      stepMainSelect_.add(option);
    }

    for (let i = 0; i < Object.keys(modes).length; i++) {
      let option = document.createElement("option");
      option.value = Object.values(modes)[i][0];
      option.text = Object.values(modes)[i][1];
      stepLeftSelect_.add(option);
    }

    for (let i = 0; i < Object.keys(modes).length; i++) {
      let option = document.createElement("option");
      option.value = Object.values(modes)[i][0];
      option.text = Object.values(modes)[i][1];
      stepRightSelect_.add(option);
    }

    this.setStepModes
        ([leftStepMode, rightStepMode], [isLeftOverlay, isRightOverlay]);

    this.clearInfo();
    
    let j = 0;
    const elems = document.getElementsByClassName(html_.info);
    for (let i = 0; i < elems.length; i++) {
      if (elems[i].tagName == "DIV") infoTextAreas_[j++] = elems[i];
    }
  };



  this.setSmoothingValue = function(sigma) {
    if ((10*sigma) % 10 == 0) sigma += ".0";
    smoothingLabel_.innerHTML = sigma;
  };



  this.setThresholds = function([lowThreshold, highThreshold]) {
    let lowTh, highTh;

    if (typeof lowThreshold !== "undefined" &&
        typeof highThreshold !== "undefined") {
      lowTh = parseInt(lowThreshold);
      highTh = parseInt(highThreshold);

      if (lowTh > highTh) {
        lowThresholdInput_.value = highTh;
        highThresholdInput_.value = lowTh;
      }
    }

    else if (typeof lowThreshold !== "undefined") {
      lowTh = parseInt(lowThreshold);
      highTh = parseInt(highThresholdInput_.value);

      if (lowTh > highTh) 
        highThresholdInput_.value = lowTh;
    }

    else if (typeof highThreshold !== "undefined") {
      lowTh = parseInt(lowThresholdInput_.value);
      highTh = parseInt(highThreshold);

      if (lowTh > highTh)
        lowThresholdInput_.value = highTh;
    }

    lowThresholdLabel_.innerHTML = lowThresholdInput_.value;
    highThresholdLabel_.innerHTML = highThresholdInput_.value;
  };



  this.setThresholdRange = function(value) {
    let lowTh = parseInt(lowThresholdInput_.value);
    let highTh = parseInt(highThresholdInput_.value);

    if (value == html_.rangeLimit25) {
      lowThresholdInput_.max = QUARTER_RANGE;
      highThresholdInput_.max = QUARTER_RANGE;
      if (lowTh > QUARTER_RANGE || highTh > QUARTER_RANGE)
        this.setThresholds([Math.min(lowTh, QUARTER_RANGE),
                            Math.min(highTh, QUARTER_RANGE)]);

      rangeTicks25Div_.style.display = "block";
      rangeTicks50Div_.style.display = "none";
      rangeTicks100Div_.style.display = "none";

      lowThresholdInput_.setAttribute ("list", html_.rangeTicks25);
      highThresholdInput_.setAttribute ("list", html_.rangeTicks25);
    }
    else if (value == html_.rangeLimit50) {
      lowThresholdInput_.max = HALF_RANGE;
      highThresholdInput_.max = HALF_RANGE;
      if (lowTh > HALF_RANGE || highTh > HALF_RANGE)
        this.setThresholds([Math.min(lowTh, HALF_RANGE),
                            Math.min(highTh, HALF_RANGE)]);

      rangeTicks25Div_.style.display = "none";
      rangeTicks50Div_.style.display = "block";
      rangeTicks100Div_.style.display = "none";

      lowThresholdInput_.setAttribute ("list", html_.rangeTicks50);
      highThresholdInput_.setAttribute ("list", html_.rangeTicks50);
    }
    else {
      lowThresholdInput_.max = FULL_RANGE;
      highThresholdInput_.max = FULL_RANGE;

      rangeTicks25Div_.style.display = "none";
      rangeTicks50Div_.style.display = "none";
      rangeTicks100Div_.style.display = "block";

      lowThresholdInput_.setAttribute ("list", html_.rangeTicks100);
      highThresholdInput_.setAttribute ("list", html_.rangeTicks100);
    }
  };



  this.getLowThreshold = function() {
    return lowThresholdInput_.value;
  };



  this.getHighThreshold = function() {
    return highThresholdInput_.value;
  };



  this.setStepModes = function
      ([leftStepMode, rightStepMode], [leftOverlay, rightOverlay]) {
    stepMainSelect_.selectedIndex = modes[leftStepMode][0];
    stepLeftSelect_.selectedIndex = modes[leftStepMode][0];
    stepRightSelect_.selectedIndex = modes[rightStepMode][0];
    overlayMainInput_.checked = leftOverlay;
    overlayLeftInput_.checked = leftOverlay;
    overlayRightInput_.checked = rightOverlay;

    isThresholdingEnabled_ =
        (leftStepMode == Object.keys(modes) [modes.THRESHOLDING[0]]) ||
        (leftStepMode == Object.keys(modes) [modes.EDGE_LINKING[0]]) ||
        (rightStepMode == Object.keys(modes) [modes.THRESHOLDING[0]]) ||
        (rightStepMode == Object.keys(modes) [modes.EDGE_LINKING[0]]) ||
        overlayMainInput_.checked || overlayLeftInput_.checked ||
        overlayRightInput_.checked;

    isSmoothingEnabled_ =
        (leftStepMode == Object.keys(modes) [modes.SMOOTHING[0]]) ||
        (leftStepMode == Object.keys(modes) [modes.GRADIENT[0]]) ||
        (leftStepMode == Object.keys(modes) [modes.NON_MAXIMA[0]]) ||
        (rightStepMode == Object.keys(modes) [modes.SMOOTHING[0]]) ||
        (rightStepMode == Object.keys(modes) [modes.GRADIENT[0]]) ||
        (rightStepMode == Object.keys(modes) [modes.NON_MAXIMA[0]]) ||
        isThresholdingEnabled_;

    util.enableInputControl(html_.smoothing, isSmoothingEnabled_);
    util.enableInputControl(html_.thresholding, isThresholdingEnabled_);
    util.enableInputControl(html_.rangeLimit, isThresholdingEnabled_);
  };



  this.setInfo = function(info) {    
    for (let i = 0; i < infoTextAreas_.length; i++) {
      let p = infoTextAreas_[i].getElementsByTagName("P")[0];
      p.className = "info";
      p.innerHTML = info;
    }
  };



  this.clearInfo = function() {
    for (let i = 0; i < infoTextAreas_.length; i++) {
      let p = infoTextAreas_[i].getElementsByTagName("P")[0];
      p.innerHTML = "";
    }
  };



  this.enableControls = function(isImageEnabled, isSmoothingEnabled,
        isThresholdingEnabled, isInfoEnabled, isModeEnabled) {
    util.enableInputControl(html_.selectImage, isImageEnabled);
    util.enableInputControl(html_.smoothing,
          isSmoothingEnabled && isSmoothingEnabled_);
    util.enableInputControl(html_.thresholding,
          isThresholdingEnabled && isThresholdingEnabled_);
    util.enableInputControl(html_.rangeLimit,
          isThresholdingEnabled && isThresholdingEnabled_);
    util.enableInputControl(html_.stepMain, isModeEnabled);
    util.enableInputControl(html_.stepLeft, isModeEnabled);
    util.enableInputControl(html_.stepRight, isModeEnabled);
    util.enableInputControl(html_.overlayMain, isModeEnabled);
    util.enableInputControl(html_.overlayLeft, isModeEnabled);
    util.enableInputControl(html_.overlayRight, isModeEnabled);

    for (let i = 0; i < infoTextAreas_.length; i++) {
      let p = infoTextAreas_[i].getElementsByTagName("P")[0];

      if (isInfoEnabled) p.className = "info";
      else {
        p.className = "error";
        p.innerHTML = "";
      }
    }
  };
}
