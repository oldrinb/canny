/*<?xml version="1.0" encoding="utf-8"?>*/

/* Interface between the JavaScript 'main.js' file and the 'index.html' file. */

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

    sliderRange: "slider-range",
    sliderRange25 : "slider-range-25",
    sliderRange50 : "slider-range-50",
    sliderRange100 : "slider-range-100",
    sliderTicks25: "slider-ticks-25",
    sliderTicks50: "slider-ticks-50",
    sliderTicks100: "slider-ticks-100",

    info: "text-info",

    leftPanel: "left-panel",
    rightPanel: "right-panel",
    leftOverlay: "left-overlay",
    rightOverlay: "right-overlay"
  };

  const selectImage_ = document.getElementById(html_.selectImage);

  const smoothingInput_ = document.getElementById(html_.smoothing);
  const smoothingLabel_ = document.getElementById(html_.smoothingValue);

  const lowThresholdInput_ = document.getElementById(html_.lowThreshold);
  const highThresholdInput_ = document.getElementById(html_.highThreshold);
  const lowThresholdLabel_ = document.getElementById(html_.lowThresValue);
  const highThresholdLabel_ = document.getElementById(html_.highThresValue);

  const sliderRange25Input_ = document.getElementById(html_.sliderRange25);
  const sliderRange50Input_ = document.getElementById(html_.sliderRange50);
  const sliderRange100Input_ = document.getElementById(html_.sliderRange100);

  const sliderTicks25Label_ = document.getElementById(html_.sliderTicks25);
  const sliderTicks50Label_ = document.getElementById(html_.sliderTicks50);
  const sliderTicks100Label_ = document.getElementById(html_.sliderTicks100);

  const infoTextarea_ = document.getElementById(html_.info);

  const leftPanelSelect_ = document.getElementById(html_.leftPanel);
  const rightPanelSelect_ = document.getElementById(html_.rightPanel);

  const leftOverlayInput_ = document.getElementById(html_.leftOverlay);
  const rightOverlayInput_ = document.getElementById(html_.rightOverlay);

  let isSmoothingEnabled_ = isThresholdingEnabled_ = false;



  this.init = function(currentImage, sigma, [lowThreshold, highThreshold],
      [currentLeftMode, currentRightMode], [isLeftOverlay, isRightOverlay]) {
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
      sliderRange100Input_.checked = true;
      this.setThresholdRange(html_.sliderRange100);
    }
    else if (highThresholdInput_.value > QUARTER_RANGE) {
      sliderRange50Input_.checked = true;
      this.setThresholdRange(html_.sliderRange50);
    }
    else {
      sliderRange25Input_.checked = true;
      this.setThresholdRange(html_.sliderRange25);
    }

    this.clearInfo();

    for (let i = leftPanelSelect_.options.length - 1; i >= 0; i--)
      leftPanelSelect_.remove(i);
    for (let i = rightPanelSelect_.options.length - 1; i >= 0; i--)
      rightPanelSelect_.remove(i);

    for (let i = 0; i < Object.keys(modes).length; i++) {
      let option = document.createElement("option");
      option.value = Object.values(modes)[i][0];
      option.text = Object.values(modes)[i][1];
      leftPanelSelect_.add(option);

      if (option.value == modes[currentLeftMode][0])
        leftPanelSelect_.selectedIndex = i;
    }

    for (let i = 0; i < Object.keys(modes).length; i++) {
      let option = document.createElement("option");
      option.value = Object.values(modes)[i][0];
      option.text = Object.values(modes)[i][1];
      rightPanelSelect_.add(option);

      if (option.value == modes[currentRightMode][0])
        rightPanelSelect_.selectedIndex = i;
    }

    leftOverlayInput_.checked = isLeftOverlay;
    rightOverlayInput_.checked = isRightOverlay;

    this.setPanelModes([currentLeftMode, currentRightMode]);
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

    if (value == html_.sliderRange25) {
      lowThresholdInput_.max = QUARTER_RANGE;
      highThresholdInput_.max = QUARTER_RANGE;
      if (lowTh > QUARTER_RANGE || highTh > QUARTER_RANGE) 
        this.setThresholds([Math.min(lowTh, QUARTER_RANGE),
                            Math.min(highTh, QUARTER_RANGE)]);

      sliderTicks25Label_.style.display = "table";
      sliderTicks50Label_.style.display = "none";
      sliderTicks100Label_.style.display = "none";

    }
    else if (value == html_.sliderRange50) {
      lowThresholdInput_.max = HALF_RANGE;
      highThresholdInput_.max = HALF_RANGE;
      if (lowTh > HALF_RANGE || highTh > HALF_RANGE) 
        this.setThresholds([Math.min(lowTh, HALF_RANGE),
                            Math.min(highTh, HALF_RANGE)]);

      sliderTicks50Label_.style.display = "table";
      sliderTicks25Label_.style.display = "none";
      sliderTicks100Label_.style.display = "none";
    }
    else {
      lowThresholdInput_.max = FULL_RANGE;
      highThresholdInput_.max = FULL_RANGE;

      sliderTicks100Label_.style.display = "table";
      sliderTicks25Label_.style.display = "none";
      sliderTicks50Label_.style.display = "none";
    }
  };



  this.getLowThreshold = function() {
    return lowThresholdInput_.value;
  };



  this.getHighThreshold = function() {
    return highThresholdInput_.value;
  };



  this.setPanelModes = function([leftPanelMode, rightPanelMode]) {
    isThresholdingEnabled_ =
        (leftPanelMode == Object.keys(modes) [modes.THRESHOLDING[0]]) ||
        (leftPanelMode == Object.keys(modes) [modes.EDGE_LINKING[0]]) ||
        (rightPanelMode == Object.keys(modes) [modes.THRESHOLDING[0]]) ||
        (rightPanelMode == Object.keys(modes) [modes.EDGE_LINKING[0]]) ||
        leftOverlayInput_.checked || rightOverlayInput_.checked;

    isSmoothingEnabled_ =
        (leftPanelMode == Object.keys(modes) [modes.SMOOTHING[0]]) ||
        (leftPanelMode == Object.keys(modes) [modes.GRADIENT[0]]) ||
        (leftPanelMode == Object.keys(modes) [modes.NON_MAXIMA[0]]) ||
        (rightPanelMode == Object.keys(modes) [modes.SMOOTHING[0]]) ||
        (rightPanelMode == Object.keys(modes) [modes.GRADIENT[0]]) ||
        (rightPanelMode == Object.keys(modes) [modes.NON_MAXIMA[0]]) ||
        isThresholdingEnabled_;

    util.enableInputControl(html_.smoothing, isSmoothingEnabled_);
    util.enableInputControl(html_.thresholding, isThresholdingEnabled_);
    util.enableInputControl(html_.sliderRange, isThresholdingEnabled_);
  };



  this.setInfo = function(info) {
    infoTextarea_.value = info;
  };



  this.clearInfo = function() {
    infoTextarea_.value = "";
  };



  this.enableControls = function(isImageEnabled, isSmoothingEnabled,
        isThresholdingEnabled, isInfoEnabled, isModeEnabled) {
    util.enableInputControl(html_.selectImage, isImageEnabled);
    util.enableInputControl(html_.smoothing,
          isSmoothingEnabled && isSmoothingEnabled_);
    util.enableInputControl(html_.thresholding,
          isThresholdingEnabled && isThresholdingEnabled_);
    util.enableInputControl(html_.sliderRange,
          isThresholdingEnabled && isThresholdingEnabled_);
    util.enableInputControl(html_.info, isInfoEnabled);
    util.enableInputControl(html_.leftPanel, isModeEnabled);
    util.enableInputControl(html_.rightPanel, isModeEnabled);
    util.enableInputControl(html_.leftOverlay, isModeEnabled);
    util.enableInputControl(html_.rightOverlay, isModeEnabled);
  };
}
