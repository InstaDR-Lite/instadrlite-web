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
    'blur-ready': (stream: MediaStream) => void;
    'remote-stream-ready': (stream: MediaStream) => void;
    'status-update': (message: string) => void;
    'error': (error: MediaDanceError) => void;
    'room-allocated': (payload: {
        roomId: string;
    }) => void;
    'bitrate-adapted': (tier: string) => void;
    'patient-admitted': () => void;
}
export declare class MediaDanceClient extends EventEmitter {
    private media;
    private signaling;
    private rtc;
    private config;
    private bitrateAdapter;
    private isCallEstablished;
    /**
     * Perfect Negotiation Tie-Breaker (Logical Lock)
     * * Determines if this client instance is the 'polite' or 'impolite' peer.
     * When an asynchronous SDP offer collision occurs (both clients attempt to
     * initiate negotiation concurrently), the impolite peer ignores the incoming
     * offer to maintain its state, while the polite peer rolls back its local
     * description to accept the remote offer.
     * * Using alphabetical comparison of Socket IDs ensures a globally unique,
     * deterministic decision on both sides without centralized synchronization.
     */
    private isPolite;
    private iceCandidateQueue;
    private blurEnabled;
    constructor(config: MediaDanceConfig);
    /**
     * Links internal module events together and prepares messages to bubble up to the UI
     */
    private orchestrateEvents;
    toggleCamera(requestedOn: boolean): Promise<MediaStream | null>;
    setBlur(enabled: boolean): Promise<MediaStream | null>;
    /**
     * Enable background blur dynamically.
     * Can be called before or during an active session.
     */
    enableBackgroundBlur(options?: BlurOptions): Promise<MediaStream | null>;
    /**
     * Disable background blur and instantly restore the raw bypass track.
     */
    disableBackgroundBlur(): Promise<MediaStream | null>;
    joinLobby(): void;
    getSocketId(): string | null;
    /**
     * High-velocity entry-point for consumer frameworks (e.g., ZenSpace)
     */
    initMedia(): Promise<MediaStream>;
    connectSignaling(token?: string, signalingUrl?: string): Promise<void>;
    joinRoom(): void;
    admitPatient(): void;
    startCall(token?: string, signalingUrl?: string): Promise<MediaStream>;
    activateAndPublishMedia(useBlur: boolean): Promise<void>;
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
    disconnect(): void;
}
//# sourceMappingURL=index.d.ts.map