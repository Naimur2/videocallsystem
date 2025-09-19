// Screen sharing loop detection utility
// This creates a hidden marker that can be detected in screen captures

export const createLoopDetectionMarker = (): HTMLElement => {
  // Remove existing marker if any
  const existingMarker = document.getElementById("screen-share-loop-detector");
  if (existingMarker) {
    existingMarker.remove();
  }

  // Create a hidden but detectable element
  const marker = document.createElement("div");
  marker.id = "screen-share-loop-detector";
  marker.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    background-color: rgb(255, 0, 255);
    z-index: 9999;
    pointer-events: none;
    opacity: 0.01;
  `;

  // Add a unique data attribute that changes every few seconds
  marker.setAttribute("data-timestamp", Date.now().toString());

  document.body.appendChild(marker);
  return marker;
};

export const removeLoopDetectionMarker = (): void => {
  const marker = document.getElementById("screen-share-loop-detector");
  if (marker) {
    marker.remove();
  }
};

// Google Meet style detection: analyze video frames for recursion patterns
export const detectInfiniteLoop = (
  videoStream: MediaStream,
  onLoopDetected: () => void
): (() => void) => {
  let isDetecting = true;
  let recursionScore = 0;
  const maxRecursionScore = 5;

  // Create marker
  createLoopDetectionMarker();

  // Create video element for analysis
  const video = document.createElement("video");
  video.srcObject = videoStream;
  video.muted = true;
  video.autoplay = true;
  video.style.display = "none";
  document.body.appendChild(video);

  // Create canvas for frame analysis
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  let frameCount = 0;
  let previousFrameData: ImageData | null = null;

  const analyzeFrame = () => {
    if (!isDetecting || !ctx) return;

    try {
      if (video.readyState >= 2) {
        canvas.width = Math.min(video.videoWidth || 640, 320);
        canvas.height = Math.min(video.videoHeight || 480, 240);

        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const currentFrameData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Look for our marker color in the frame (indicates we're capturing our own window)
          const pixels = currentFrameData.data;
          let markerPixelsFound = 0;

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Check for our marker color (255, 0, 255) with some tolerance
            if (r > 200 && g < 50 && b > 200) {
              markerPixelsFound++;
            }
          }

          // If we find our marker, we're definitely in a loop
          if (markerPixelsFound > 0) {
            recursionScore += 3;
            console.warn(
              `[LoopDetection] Marker found in screen capture! Score: ${recursionScore}`
            );
          }

          // Additional check: compare frame similarity
          if (previousFrameData && frameCount > 5) {
            let identicalPixels = 0;
            for (
              let i = 0;
              i < Math.min(pixels.length, previousFrameData.data.length);
              i += 4
            ) {
              if (
                Math.abs(pixels[i] - previousFrameData.data[i]) < 10 &&
                Math.abs(pixels[i + 1] - previousFrameData.data[i + 1]) < 10 &&
                Math.abs(pixels[i + 2] - previousFrameData.data[i + 2]) < 10
              ) {
                identicalPixels++;
              }
            }

            const similarityRatio = identicalPixels / (pixels.length / 4);
            if (similarityRatio > 0.98) {
              recursionScore += 1;
            } else {
              recursionScore = Math.max(0, recursionScore - 1);
            }
          }

          previousFrameData = currentFrameData;
          frameCount++;

          // Trigger detection if score is too high
          if (recursionScore >= maxRecursionScore) {
            console.error(
              "[LoopDetection] Infinite loop detected! Stopping..."
            );
            onLoopDetected();
            return; // Stop analyzing
          }
        }
      }
    } catch (error) {
      console.log("[LoopDetection] Frame analysis error:", error);
    }

    // Continue analyzing (but with longer intervals as time goes on)
    const interval = Math.min(1000 + frameCount * 100, 5000);
    setTimeout(analyzeFrame, interval);
  };

  // Start analysis after a delay
  setTimeout(analyzeFrame, 2000);

  // Cleanup function
  return () => {
    isDetecting = false;
    removeLoopDetectionMarker();
    video.remove();
    canvas.remove();
  };
};
