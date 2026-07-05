export declare class MediaManager {
    private localRawStream;
    private localOutputStream;
    private blurProcessor;
    private blurEnabled;
    private blurOptions;
    captureLocalStream(video?: boolean, audio?: boolean): Promise<MediaStream>;
    setBlur(enabled: boolean, options?: any): Promise<MediaStream | null>;
    private applyBlurState;
    private refreshOutputTracks;
    stopLocalStream(): void;
    getStream(): MediaStream | null;
    setStream(localStream: MediaStream): void;
    toggleTrack(type: 'video' | 'audio', enabled: boolean): void;
}
//# sourceMappingURL=MediaManager.d.ts.map