import { EventEmitter } from '../utils/EventEmitter.js';
export declare class WebRTCManager extends EventEmitter {
    private iceServers;
    private pc;
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
}
//# sourceMappingURL=WebRTCManager.d.ts.map