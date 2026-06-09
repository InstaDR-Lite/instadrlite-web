import { EventEmitter } from '../utils/EventEmitter.js';
export declare class SignalingManager extends EventEmitter {
    private serverUrl;
    private socket;
    constructor(serverUrl: string);
    /**
     * Exposes the active socket connection ID for perfect negotiation handshakes
     */
    getSocketID(): string | null;
    /**
     * connect is the critical first step in the MediaDance handshake sequence.
     * It establishes a secure socket connection to the Signaling Server, which
     * serves as the trusted intermediary for all subsequent WebRTC negotiations.
     * By accepting a signed JWT token and a dynamic signaling URL, this method
     * ensures that only authenticated clients can join the
     * communication ecosystem, while also providing flexibility in
     * infrastructure deployment.
     * @param token
     * @param signalingUrl
     * @returns
     */
    connect(token: string, signalingUrl: string): Promise<string>;
    /**
     * setupListeners centralizes all socket event bindings in one place for clarity and maintainability.
     * @returns
     */
    private setupListeners;
    emitEvent(event: string, data: any): void;
    disconnect(): void;
}
//# sourceMappingURL=SignalingManager.d.ts.map