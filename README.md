Image processiong on GPU. This application implements a popular and effective edge detector.
Detecting edges is one of the most fundamental algorithms in image processing, used as a pre-processing step in many computer vision algorithms.

It consists of the following basic steps:
1. Image smoothing with a Gaussian filter, in order to remove the noise.
2. Computing the gradient magnitude and direction, to estimate the edge
strength and direction at every point. The image generated contains wide
ridges around local maxima.
3. Non-maxima suppression, in order to thin the ridges detected above.
4. Hysteresis thresholding, uses two thresholds to determine potential edges:
- pixels above the high threshold are considered "strong", they are deemed
to come from true edges in the image, but they contain gaps;
- pixels between the two thresholds are considered "weak", they are either part
of an edge, or they come from noise;
- pixels below the low threshold are discarded.
5. Edge linking, in order to fill the gaps in the edges determined above.
"Strong" pixels are assumed to be valid edge points. "Weak" pixels are
considered valid, only if they are connected with a "strong" pixel. All the
other ones are considered noise, and discarded.

Project:
oldrinb.dev/projects/canny

References:
[1] Richard E. Woods, Rafael C. Gonzales. Digital Image Processing, 3rd edition, p. 741-747, 2008

