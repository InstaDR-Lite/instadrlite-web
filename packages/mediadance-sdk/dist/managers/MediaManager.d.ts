export declare class MediaManager {
    private localStream;
    /**
     * Captures the local device tracks securely with hardware optimizations and clean cancellation rails
     */
    captureLocalStream(video?: boolean, audio?: boolean): Promise<MediaStream>;
    /**
     * Returns the active local media stream reference
     */
    getStream(): MediaStream | null;
    setStream(localStream: MediaStream): void;
    /**
     * Physically enables or disables tracks on the stream level to mute hardware
     */
    toggleTrack(type: 'video' | 'audio', enabled: boolean): void;
}
//# sourceMappingURL=MediaManager.d.ts.map