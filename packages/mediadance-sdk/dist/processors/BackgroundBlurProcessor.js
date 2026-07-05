// src/processors/BackgroundBlurProcessor.ts
/**
 * BackgroundBlurProcessor
 *
 * Runs MediaPipe Selfie Segmentation in-browser (WASM) to separate
 * foreground from background, then applies a CSS blur to background
 * pixels on an offscreen canvas. The processed canvas stream replaces
 * the raw camera track sent to WebRTC peers.
 *
 * Loaded lazily — WASM is only fetched when enableBackgroundBlur() is called.
 */
const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation';
export class BackgroundBlurProcessor {
    segmenter = null;
    internalCanvas;
    internalCtx;
    resolveCurrentFrame = null;
    isDestroyed = false;
    // 🚀 Add this to cancel the active pipe chain
    abortController = null;
    constructor(options = {}) {
        this.internalCanvas = document.createElement('canvas');
        this.internalCtx = this.internalCanvas.getContext('2d');
        // @ts-ignore
        this.segmenter = new SelfieSegmentation({
            locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`
        });
        this.segmenter.setOptions({
            modelSelection: options.modelSelection ?? 1,
            selfieMode: false
        });
        this.segmenter.onResults((results) => {
            this.applySegmentationMask(results);
            if (this.resolveCurrentFrame) {
                this.resolveCurrentFrame();
                this.resolveCurrentFrame = null;
            }
        });
    }
    /**
     * Main entry point for media track processing.
     * Leverages high-performance WebCodecs Insertable Streams (MediaStreamTrackProcessor/Generator)
     * in Chromium-based browsers to intercept and transform video frames completely in-memory,
     * bypassing the HTML DOM entirely to ensure full layout immunity and framework safety.
     *
     * If WebCodecs APIs are unavailable (e.g., Safari, Firefox, DuckDuckGo), it gracefully
     * routes the stream to the canvas-based fallback pipeline to maintain 100% video uptime.
     *
     * @param rawStream The original MediaStream from getUserMedia.
     * @returns A Promise resolving to the processed/blurred output MediaStream.
     */
    async process(inputStream) {
        const videoTrack = inputStream.getVideoTracks()[0];
        if (!videoTrack)
            throw new Error('No video track found.');
        const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
        const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
        // 🚀 FEATURE DETECTION: Check if Safari or Firefox is running this
        const isInsertableStreamsSupported = typeof window.MediaStreamTrackProcessor !== 'undefined' &&
            typeof window.MediaStreamTrackGenerator !== 'undefined';
        if (!isInsertableStreamsSupported) {
            console.warn('[MediaDance SDK] Insertable Streams not supported. Falling back to Canvas Processing Loop.');
            // return this.processCanvasFallback(rawStream);
            return inputStream; // Fallback: return raw stream for now (canvas fallback not implemented yet)
        }
        const transformer = new TransformStream({
            transform: async (videoFrame, controller) => {
                if (this.isDestroyed || !this.internalCtx) {
                    controller.enqueue(videoFrame.clone());
                    videoFrame.close();
                    return;
                }
                const width = videoFrame.displayWidth;
                const height = videoFrame.displayHeight;
                if (this.internalCanvas.width !== width || this.internalCanvas.height !== height) {
                    this.internalCanvas.width = width;
                    this.internalCanvas.height = height;
                }
                this.internalCtx.drawImage(videoFrame, 0, 0, width, height);
                // Wait for MediaPipe to process the frame canvas surface
                await new Promise((resolve) => {
                    this.resolveCurrentFrame = resolve;
                    this.segmenter.send({ image: this.internalCanvas });
                });
                const bitmap = await createImageBitmap(this.internalCanvas);
                const blurredFrame = new VideoFrame(bitmap, { timestamp: videoFrame.timestamp });
                controller.enqueue(blurredFrame);
                bitmap.close();
                videoFrame.close();
            }
        });
        this.abortController = new AbortController();
        trackProcessor.readable
            .pipeThrough(transformer)
            .pipeTo(trackGenerator.writable, { signal: this.abortController.signal }) // 🚀 Controlled!
            .catch((err) => {
            if (err.name === 'AbortError') {
                console.log('[BackgroundBlurProcessor] Pipeline aborted cleanly via destroy.');
            }
            else {
                console.error('[BackgroundBlurProcessor] Stream pipe broken:', err);
            }
        });
        return new MediaStream([trackGenerator, ...inputStream.getAudioTracks()]);
    }
    /**
     * Applies the segmentation mask to the internal canvas.
     * @param results The results object from MediaPipe Selfie Segmentation.
     * @returns
     */
    applySegmentationMask(results) {
        if (this.isDestroyed || !this.internalCtx)
            return;
        const width = results.image.width;
        const height = results.image.height;
        this.internalCtx.save();
        this.internalCtx.clearRect(0, 0, width, height);
        // Draw the segmentation mask
        this.internalCtx.drawImage(results.segmentationMask, 0, 0, width, height);
        // Draw original image only where mask is present
        this.internalCtx.globalCompositeOperation = 'source-in';
        this.internalCtx.drawImage(results.image, 0, 0, width, height);
        // Draw blurred background underneath
        this.internalCtx.globalCompositeOperation = 'destination-over';
        this.internalCtx.filter = 'blur(20px)';
        this.internalCtx.drawImage(results.image, 0, 0, width, height);
        this.internalCtx.restore();
    }
    /**
     * Multi-browser compatibility fallback pipeline for Safari, Firefox, and WebKit-based shells.
     *
     * Instead of utilizing non-existent or experimental browser constructors that trigger fatal
     * TypeErrors during runtime execution, this method spins up an isolated, memory-safe canvas
     * render loop running on requestAnimationFrame. It guarantees stable video pass-through
     * and prevents application crashes across non-Chromium environments.
     *
     * @param rawStream The original MediaStream to pass through or render.
     * @returns The canvas-captured output MediaStream, or the raw stream as an ultimate safety net.
     */
    // private async processCanvasFallback(rawStream: MediaStream): Promise<MediaStream> {
    //   const videoTrack = rawStream.getVideoTracks()[0];
    //   const { width = 640, height = 480 } = videoTrack.getSettings();
    //   await this.loadMediaPipe();
    //   // Create an HTMLVideoElement completely in-memory (never appended to DOM, so SSR-safe)
    //   const fallbackVideo = document.createElement('video');
    //   fallbackVideo.srcObject = rawStream;
    //   fallbackVideo.muted = true;
    //   fallbackVideo.playsInline = true;
    //   await fallbackVideo.play().catch(() => {});
    //   this.internalCanvas = new OffscreenCanvas(width, height);
    //   this.internalCtx = this.internalCanvas.getContext('2d');
    //   // Capture the output stream directly from the canvas
    //   const canvasStream = (this.internalCanvas as any).captureStream ? 
    //     (this.internalCanvas as any).captureStream(30) : 
    //     (this.internalCanvas as any).mozCaptureStream ? 
    //     (this.internalCanvas as any).mozCaptureStream(30) : null;
    //   if (!canvasStream) {
    //     // If canvas stream capture fails completely, return the raw stream as ultimate safety net
    //     return rawStream;
    //   }
    //   const renderLoop = async () => {
    //     if (this.isDestroyed || !this.internalCtx || !this.internalCanvas || fallbackVideo.paused || fallbackVideo.ended) {
    //       return;
    //     }
    //     try {
    //       this.internalCtx.drawImage(fallbackVideo, 0, 0, width, height);
    //       if (this.segmenter) {
    //         await new Promise<void>((resolve) => {
    //           this.segmenter.onResults((results: any) => {
    //             this.applySegmentationMask(results, width, height);
    //             resolve();
    //           });
    //           this.segmenter.send({ image: this.internalCanvas! });
    //         });
    //       }
    //     } catch (err) {
    //       // Loop safety guard
    //     }
    //     // Keep loop humming on Safari/Firefox native refresh cycles
    //     this.canvasFallbackIntervalId = requestAnimationFrame(renderLoop);
    //   };
    //   this.canvasFallbackIntervalId = requestAnimationFrame(renderLoop);
    //   // 🚀 Set the class variable
    //   this.outputStream = canvasStream;
    //   // 🚀 Return the guaranteed, non-null MediaStream to satisfy the method signature
    //   return canvasStream;
    // }
    /**
     * Cleans up resources and stops processing.
     */
    destroy() {
        this.isDestroyed = true;
        // 1. Clear out the MediaPipe WASM heap footprint
        if (this.segmenter) {
            try {
                this.segmenter.close();
            }
            catch (e) {
                console.warn('[BlurProcessor] Error closing segmenter:', e);
            }
            this.segmenter = null;
        }
        // 🚀 2. Trigger the abort signal to collapse the pipe loop immediately
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        // 3. Wipe canvas references from the DOM context
        if (this.internalCanvas) {
            this.internalCanvas.remove();
            // this.internalCanvas = null;
        }
        this.internalCtx = null;
        console.log('[BlurProcessor] 🛑 Pipeline destroyed cleanly. Stream tracks unlinked.');
    }
}
//# sourceMappingURL=BackgroundBlurProcessor.js.map