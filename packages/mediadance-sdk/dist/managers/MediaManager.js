// telehealth-sdk/src/managers/MediaManager.ts
export class MediaManager {
    localStream = null;
    /**
     * Captures the local device tracks securely with hardware optimizations and clean cancellation rails
     */
    async captureLocalStream(video = true, audio = true) {
        if (typeof window === 'undefined') {
            throw new Error('Media capture cannot be executed on the server-side.');
        }
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true
                } : false,
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 24 }
                } : false
            });
            return this.localStream;
        }
        catch (error) {
            console.error('SDK MediaManager: Error accessing hardware lines', error);
            // Map cryptic native browser exceptions to clean, actionable SDK error states
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error('HARDWARE_PERMISSION_BLOCKED');
            }
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error('HARDWARE_NOT_FOUND');
            }
            throw error;
        }
    }
    /**
     * Returns the active local media stream reference
     */
    getStream() {
        return this.localStream;
    }
    setStream(localStream) {
        this.localStream = localStream;
    }
    /**
     * Physically enables or disables tracks on the stream level to mute hardware
     */
    toggleTrack(type, enabled) {
        if (!this.localStream)
            return;
        const tracks = type === 'video' ? this.localStream.getVideoTracks() : this.localStream.getAudioTracks();
        tracks.forEach(track => (track.enabled = enabled));
    }
}
//# sourceMappingURL=MediaManager.js.map