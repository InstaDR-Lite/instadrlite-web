import { EventEmitter } from '../utils/EventEmitter.js';
export declare class WebRTCManager extends EventEmitter {
    private iceServers;
    private peerConnection;
    constructor(iceServers: RTCIceServer[]);
    initiateConnection(targetSocketId: string, localStream: MediaStream | null): RTCPeerConnection;
    getPeerConnection(): RTCPeerConnection | null;
    /**
     * Processes incoming Session Descriptions (Offers/Answers) from a remote peer
     */
    handleRemoteDescription(targetSocketId: string, sdp: RTCSessionDescriptionInit, localStream: MediaStream | null): Promise<RTCSessionDescriptionInit | null>;
    /**
     * Appends an incoming network routing candidate to the live pipeline
     */
    handleRemoteIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    /**
     * Checks if an active peer connection is currently established
     */
    isActive(): boolean;
    /**
     * Hot-swaps the active media tracks on the live connection without renegotiating
     */
    updateLocalTracks(newStream: MediaStream): Promise<void>;
    /**
     * Gracefully handles camera muting by dropping tracks on the connection
     */
    handleVideoMute(): Promise<void>;
    closeConnection(): void;
}
//# sourceMappingURL=WebRTCManager.d.ts.map