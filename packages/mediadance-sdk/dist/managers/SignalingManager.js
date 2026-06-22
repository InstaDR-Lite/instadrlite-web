// telehealth-sdk/src/managers/SignalingManager.ts
import { io } from 'socket.io-client';
import { EventEmitter } from '../utils/EventEmitter.js';
export class SignalingManager extends EventEmitter {
    serverUrl;
    socket = null;
    constructor(serverUrl) {
        super();
        this.serverUrl = serverUrl;
    }
    /**
     * Exposes the active socket connection ID for perfect negotiation handshakes
     */
    getSocketID() {
        return this.socket && this.socket.id ? this.socket.id : null;
    }
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
    connect(token, signalingUrl) {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                return reject('Cannot connect on server side');
            }
            // If a socket exists and is connected, resolve immediately
            if (this.socket?.connected) {
                return resolve(this.socket.id || '');
            }
            console.log('[SDK Signaling] Initializing secure handshake connection...', signalingUrl);
            // 1. DYNAMIC URL & AUTH INJECTION
            // We target the explicit infrastructure node and attach the signed JWT
            this.socket = io(signalingUrl, {
                secure: true, // Enforce secure connection (wss://) for WebSocket transport
                rejectUnauthorized: false, // ← needed for self-signed certs in Node context
                transports: ['websocket', 'polling'], // Allow fallback to polling if WebSocket fails, but prefer WebSocket for performance
                auth: {
                    token: token // This single payload replaces the spoofable client-side tenantID
                }
                // auth: {
                //   tenantID:  'tenant_zenspace_prod_01' // For development/testing, we can use a static tenantID since the server guard will verify the token offline. In production, this should be dynamically injected based on the authenticated user's context.
                // }
            });
            this.setupListeners();
            // 2. LIFECYCLE MANAGEMENT
            // Resolve explicitly once the MediaDance Gateway verifies the token payload offline
            this.socket.on('connect', () => {
                console.log('[SDK Signaling] Handshake verified. Connected with ID:', this.socket?.id);
                resolve(this.socket?.id || '');
            });
            // Catch cryptographic rejections (e.g., token expired, invalid signature)
            this.socket.on('connect_error', (error) => {
                console.error('[SDK Signaling] Cryptographic Handshake rejection:', error.message);
                reject(error);
            });
        });
    }
    /**
     * setupListeners centralizes all socket event bindings in one place for clarity and maintainability.
     * @returns
     */
    setupListeners() {
        if (!this.socket)
            return;
        this.socket.on('connect', () => this.emit('connected', this.socket?.id));
        this.socket.on('disconnect', (reason) => this.emit('disconnected', reason));
        // Pass the exact event straight from the server socket out to the orchestrator layer
        this.socket.on('peer-joined', (data) => this.emit('peer-joined', data));
        this.socket.on('peer-notification', (data) => {
            if (data.type === 'peer-disconnected') {
                this.emit('peer-disconnected', data);
            }
            this.emit('peer-notification', data);
        });
        this.socket.on('ice-candidate', (data) => this.emit('ice-candidate', data));
    }
    emitEvent(event, data) {
        this.socket?.emit(event, data);
    }
    get socketID() {
        return this.socket?.id || null;
    }
    disconnect() {
        this.socket?.disconnect();
    }
}
//# sourceMappingURL=SignalingManager.js.map