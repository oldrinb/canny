This application implements the Canny edge detection algorithm, implemented
using GLSL shaders. It consists of the following basic steps:
1. Image smoothing with a Gaussian filter, in order to remove the noise.
2. Computing the gradient magnitude and direction, to estimate the edge
strength and direction at every point. The image generated contains wide
ridges around local maxima.
3. Non-maxima suppression, in order to thin the ridges detected above.
4. Hysteresis thresholding, uses two thresholds to determine potential edges:
- pixels above the high threshold are considered 'strong', they are deemed
to come from true edges in the image;
- pixels between the two thresholds are considered 'weak', they are either part
of an edge, or they come from noise;
- pixels below the low threshold are discarded.
It is suggested in [1] that the ratio of the high to low threshold should be two
or three to one.
5. Edge linking, in order to fill the gaps in the edges determined above.
'Strong' pixels are assumed to be valid edge points. 'Weak' pixels are
considered valid only if they are connected with a 'strong pixel'. All the
other 'weak' pixels are considered noise, and discarded.

www.oldrinb.dev/projects/canny

References:

[1] Richard E. Woods, Rafael C. Gonzales, "Digital Image Processing,
3rd edition", p. 741-747, 2008
[2] Wikipedia. Canny edge detector,
https://en.wikipedia.org/wiki/Canny_edge_detector
