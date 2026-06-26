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
    rawStream = null;
    outputStream = null;
    video = null;
    canvas = null;
    ctx = null;
    segmenter = null; // MediaPipe SelfieSegmentation instance
    animFrameId = null;
    lastFrameTime = 0;
    blurRadius;
    fps;
    modelSelection;
    frameInterval;
    isRunning = false;
    constructor(options = {}) {
        this.blurRadius = options.blurRadius ?? 12;
        this.fps = options.fps ?? 24;
        this.modelSelection = options.modelSelection ?? 1;
        this.frameInterval = 1000 / this.fps;
    }
    // ─── PUBLIC API ────────────────────────────────────────────────────────────
    /**
     * Takes the raw camera MediaStream, loads MediaPipe if needed,
     * starts the canvas render loop, and returns the processed stream.
     */
    async process(rawStream) {
        this.rawStream = rawStream;
        await this.loadMediaPipe();
        this.setupCanvas(rawStream);
        // 🔥 THE FIX: Fire-and-forget the loop so it runs on the next event loop tick
        setTimeout(() => {
            this.startLoop();
        }, 0);
        return this.outputStream;
    }
    /**
     * Tear down the canvas loop and release resources.
     * The raw stream tracks are NOT stopped here — MediaDance manages those.
     */
    destroy() {
        this.isRunning = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.segmenter) {
            this.segmenter.close();
            this.segmenter = null;
        }
        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
        this.canvas = null;
        this.ctx = null;
        this.outputStream = null;
        this.rawStream = null;
    }
    // ─── MEDIAPIPE INIT ────────────────────────────────────────────────────────
    async loadMediaPipe() {
        if (this.segmenter)
            return;
        // Already on window from preload — skip script injection
        console.log('[BlurProcessor] SelfieSegmentation on window?', !!window.SelfieSegmentation);
        console.log('[BlurProcessor] Script tag in DOM?', !!document.querySelector(`script[src*="selfie_segmentation"]`));
        if (!window.SelfieSegmentation) {
            await new Promise((resolve, reject) => {
                if (document.querySelector(`script[src*="selfie_segmentation"]`)) {
                    console.log('[BlurProcessor] Script exists, polling for SelfieSegmentation...');
                    const interval = setInterval(() => {
                        console.log('[BlurProcessor] Polling... SelfieSegmentation?', !!window.SelfieSegmentation);
                        if (window.SelfieSegmentation) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                    return;
                }
                const script = document.createElement('script');
                script.src = `${MEDIAPIPE_CDN}/selfie_segmentation.js`;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load MediaPipe'));
                document.head.appendChild(script);
            });
        }
        this.initSegmenter();
    }
    initSegmenter() {
        const SelfieSegmentation = window.SelfieSegmentation;
        this.segmenter = new SelfieSegmentation({
            locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
        });
        this.segmenter.setOptions({ modelSelection: this.modelSelection });
        this.segmenter.onResults((results) => this.renderFrame(results));
    }
    // ─── CANVAS SETUP ──────────────────────────────────────────────────────────
    setupCanvas(rawStream) {
        const videoTrack = rawStream.getVideoTracks()[0];
        const { width = 1280, height = 720 } = videoTrack.getSettings();
        // Offscreen video element — feeds frames to MediaPipe
        this.video = document.createElement('video');
        this.video.srcObject = rawStream;
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;
        this.video.width = width;
        this.video.height = height;
        // Offscreen canvas — receives composited output
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        // Capture the canvas as a MediaStream (video only)
        // Audio track passed through from raw stream unchanged
        const canvasVideoTrack = this.canvas.captureStream(this.fps).getVideoTracks()[0];
        const audioTracks = rawStream.getAudioTracks();
        this.outputStream = new MediaStream([canvasVideoTrack, ...audioTracks]);
    }
    // ─── RENDER LOOP ───────────────────────────────────────────────────────────
    startLoop() {
        this.isRunning = true;
        const loop = async () => {
            if (!this.isRunning)
                return;
            if (this.video && this.segmenter && this.video.readyState >= 2) {
                await this.segmenter.send({ image: this.video });
            }
            setTimeout(loop, this.frameInterval);
        };
        loop();
    }
    /**
     * Called by MediaPipe with segmentation mask + original image.
     * Composites: sharp foreground over blurred background.
     */
    renderFrame(results) {
        if (!this.ctx || !this.canvas)
            return;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        // 1. Draw blurred background
        this.ctx.save();
        this.ctx.filter = `blur(${this.blurRadius}px)`;
        this.ctx.drawImage(results.image, 0, 0, width, height);
        this.ctx.restore();
        // 2. Use segmentation mask to cut out the person
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.drawImage(results.segmentationMask, 0, 0, width, height);
        this.ctx.restore();
        // 3. Draw sharp foreground (person) on top
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-atop';
        this.ctx.drawImage(results.image, 0, 0, width, height);
        this.ctx.restore();
    }
}
//# sourceMappingURL=BackgroundBlurProcessor.js.map