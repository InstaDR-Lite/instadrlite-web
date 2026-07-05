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
export interface BlurOptions {
    /** Gaussian blur radius in pixels applied to background. Default: 12 */
    blurRadius?: number;
    /** Target FPS for the canvas processing loop. Default: 24 */
    fps?: number;
    /**
     * MediaPipe model selection:
     *   0 = general (faster, slightly less accurate)
     *   1 = landscape (slower, more accurate — better for desktop clinical use)
     * Default: 1
     */
    modelSelection?: 0 | 1;
}
export declare class BackgroundBlurProcessor {
    private segmenter;
    private internalCanvas;
    private internalCtx;
    private resolveCurrentFrame;
    private isDestroyed;
    private abortController;
    constructor(options?: any);
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
    process(inputStream: MediaStream): Promise<MediaStream>;
    /**
     * Applies the segmentation mask to the internal canvas.
     * @param results The results object from MediaPipe Selfie Segmentation.
     * @returns
     */
    private applySegmentationMask;
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
    /**
     * Cleans up resources and stops processing.
     */
    destroy(): void;
}
//# sourceMappingURL=BackgroundBlurProcessor.d.ts.map