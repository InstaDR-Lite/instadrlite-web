import { EventEmitter } from './utils/EventEmitter.js';
import { MediaDanceError } from './types/errors.js';
export { MediaDanceError } from './types/errors.js';
export type { MediaDanceErrorSeverity } from './types/errors.js';
import { BlurOptions } from './processors/BackgroundBlurProcessor.js';
export interface MediaDanceConfig {
    serverUrl: string;
    iceServers?: RTCIceServer[];
}
export interface MediaDanceClientEvents {
    'local-stream-ready': (stream: MediaStream) => void;
    'remote-stream-ready': (stream: MediaStream) => void;
    'status-update': (message: string) => void;
    'error': (error: MediaDanceError) => void;
    'room-allocated': (payload: {
        roomId: string;
    }) => void;
    'bitrate-adapted': (tier: string) => void;
}
export declare class MediaDanceClient extends EventEmitter {
    private media;
    private signaling;
    private rtc;
    private config;
    private bitrateAdapter;
    private blurProcessor;
    private blurEnabled;
    private blurOptions;
    constructor(config: MediaDanceConfig);
    /**
     * Links internal module events together and prepares messages to bubble up to the UI
     */
    private orchestrateEvents;
    /**
     * Enable background blur. Call before startCall().
     * If called mid-call, takes effect on next startCall().
     *
     * @param options - BlurOptions (blurRadius, fps, modelSelection)
     */
    enableBackgroundBlur(options?: BlurOptions): void;
    /**
     * Disable background blur and release processor resources.
     */
    disableBackgroundBlur(): void;
    /**
     * High-velocity entry-point for consumer frameworks (e.g., ZenSpace)
     */
    startCall(token?: string, signalingUrl?: string): Promise<MediaStream>;
    /**
     * Generates and transmits an initial WebRTC offer to a newly joined peer.
     */
    createCallOffer(targetSocketId: string): Promise<void>;
    /**
     * Private tracking bootsmith. Ensures stats are captured cleanly.
     */
    private initializeBitrateTracking;
    muteAudio(isMuted: boolean): void;
    muteVideo(isMuted: boolean): void;
    /**
     * Explicitly closes networking channels and gives OS back mic/cam resources.
     */
    leave(): void;
}
//# sourceMappingURL=index.d.ts.map