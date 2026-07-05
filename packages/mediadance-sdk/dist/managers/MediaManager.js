// src/managers/MediaManager.ts
import { BackgroundBlurProcessor } from "../processors/BackgroundBlurProcessor.js";
export class MediaManager {
    localRawStream = null;
    localOutputStream = null;
    blurProcessor = null;
    blurEnabled = false;
    blurOptions = {};
    async captureLocalStream(video = true, audio = true) {
        try {
            this.localRawStream = await navigator.mediaDevices.getUserMedia({
                audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
                video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } } : false
            });
        }
        catch (error) {
            console.error('Error accessing hardware lines', error);
            throw error;
        }
        if (!this.localOutputStream) {
            this.localOutputStream = new MediaStream();
        }
        this.refreshOutputTracks();
        return this.localOutputStream;
    }
    async setBlur(enabled, options = {}) {
        this.blurEnabled = enabled;
        if (enabled && Object.keys(options).length > 0) {
            this.blurOptions = options;
        }
        if (!this.localRawStream)
            return null;
        await this.applyBlurState();
        return this.localOutputStream;
    }
    async applyBlurState() {
        if (this.blurEnabled) {
            // 1. Turn ON: Build processor if it doesn't exist
            if (!this.blurProcessor) {
                this.blurProcessor = new BackgroundBlurProcessor(this.blurOptions);
            }
            // Feed raw stream, get the processed stream back
            const processedStream = await this.blurProcessor.process(this.localRawStream);
            const blurredVideoTrack = processedStream.getVideoTracks()[0];
            // Clear out output container tracks and mount the blurred track
            if (blurredVideoTrack) {
                const oldVideoTracks = this.localOutputStream.getVideoTracks();
                oldVideoTracks.forEach(track => this.localOutputStream.removeTrack(track));
                this.localOutputStream.addTrack(blurredVideoTrack);
            }
        }
        else {
            // 2. Turn OFF: Revert directly to the crisp raw hardware tracks
            this.refreshOutputTracks();
        }
    }
    refreshOutputTracks() {
        if (!this.localRawStream || !this.localOutputStream)
            return;
        const currentTracks = this.localOutputStream.getTracks();
        currentTracks.forEach(track => this.localOutputStream.removeTrack(track));
        this.localRawStream.getTracks().forEach(track => this.localOutputStream.addTrack(track));
    }
    stopLocalStream() {
        // 1. Fully tear down the loop and the WASM segmenter memory first
        if (this.blurProcessor) {
            this.blurProcessor.destroy();
            this.blurProcessor = null;
        }
        // 🚀 2. CRUCIAL: Explicitly stop the GENERATED output tracks before nullifying
        if (this.localOutputStream) {
            this.localOutputStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[MediaManager] Stopped output pipeline track: ${track.id}`);
            });
            this.localOutputStream = null;
        }
        // 3. Stop the hardware camera tracks
        if (this.localRawStream) {
            this.localRawStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[MediaManager] Stopped raw hardware track: ${track.id}`);
            });
            this.localRawStream = null;
        }
    }
    getStream() {
        return this.localOutputStream;
    }
    setStream(localStream) {
        this.localRawStream = localStream;
        if (this.localOutputStream) {
            this.refreshOutputTracks();
        }
    }
    toggleTrack(type, enabled) {
        if (!this.localOutputStream)
            return;
        const tracks = type === 'video' ? this.localOutputStream.getVideoTracks() : this.localOutputStream.getAudioTracks();
        tracks.forEach(track => (track.enabled = enabled));
    }
}
//# sourceMappingURL=MediaManager.js.map