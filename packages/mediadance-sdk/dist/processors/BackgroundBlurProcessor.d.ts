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
    private rawStream;
    private outputStream;
    private video;
    private canvas;
    private ctx;
    private segmenter;
    private animFrameId;
    private lastFrameTime;
    private readonly blurRadius;
    private readonly fps;
    private readonly modelSelection;
    private readonly frameInterval;
    private isRunning;
    constructor(options?: BlurOptions);
    /**
     * Takes the raw camera MediaStream, loads MediaPipe if needed,
     * starts the canvas render loop, and returns the processed stream.
     */
    process(rawStream: MediaStream): Promise<MediaStream>;
    /**
     * Tear down the canvas loop and release resources.
     * The raw stream tracks are NOT stopped here — MediaDance manages those.
     */
    destroy(): void;
    private loadMediaPipe;
    private setupCanvas;
    private startLoop;
    /**
     * Called by MediaPipe with segmentation mask + original image.
     * Composites: sharp foreground over blurred background.
     */
    private renderFrame;
}
//# sourceMappingURL=BackgroundBlurProcessor.d.ts.map