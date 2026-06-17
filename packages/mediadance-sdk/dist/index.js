// telehealth-sdk/src/index.ts
import { EventEmitter } from './utils/EventEmitter.js';
import { MediaManager } from './managers/MediaManager.js';
import { SignalingManager } from './managers/SignalingManager.js';
import { WebRTCManager } from './managers/WebRTCManager.js';
import { BitrateAdapter } from './modules/BitrateAdapter.js'; // 💡 Dropping in our adaptive engine
import { MediaDanceError } from './types/errors.js';
export { MediaDanceError } from './types/errors.js';
import { BackgroundBlurProcessor } from './processors/BackgroundBlurProcessor.js';
export class MediaDanceClient extends EventEmitter {
    media;
    signaling;
    rtc;
    config;
    bitrateAdapter = null; // 💡 Background adaptive tracking reference
    blurProcessor = null;
    blurEnabled = false;
    blurOptions = {};
    constructor(config) {
        super();
        this.config = config || {
            serverUrl: 'https://localhost:3001',
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        this.media = new MediaManager();
        this.signaling = new SignalingManager(this.config.serverUrl || 'https://localhost:3001');
        this.rtc = new WebRTCManager(this.config.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }]);
        this.orchestrateEvents();
    }
    /**
     * Links internal module events together and prepares messages to bubble up to the UI
     */
    orchestrateEvents() {
        // Forward remote stream discovery straight out to the NextJS UI layer
        this.rtc.on('remote-stream-ready', (stream) => this.emit('remote-stream-ready', stream));
        // Handle when internal WebRTC generates an ICE candidate, route it automatically to signaling
        this.rtc.on('ice-candidate-generated', (data) => {
            this.signaling.emitEvent('signal-ice-sdp', { targetSocketID: data.target, candidate: data.candidate });
        });
        // Handle incoming SDP negotiation exchanges (Offers, Answers, and ICE candidates)
        this.signaling.on('peer-notification', async (data) => {
            this.emit('status-update', 'Incoming peer handshake detected...');
            try {
                if (data.sdp) {
                    const localStream = this.media.getStream();
                    const localAnswer = await this.rtc.handleRemoteDescription(data.senderSocketID, data.sdp, localStream);
                    if (localAnswer) {
                        this.signaling.emitEvent('signal-ice-sdp', {
                            targetSocketID: data.senderSocketID,
                            sdp: localAnswer
                        });
                        this.emit('status-update', 'SDP Answer dispatched to peer.');
                        // 💡 RECV SIDE INTERCEPT: We are responding to an offer. Fire up the statistics engine helper!
                        const pc = this.rtc.getPeerConnection();
                        if (pc)
                            this.initializeBitrateTracking(pc);
                    }
                    else {
                        this.emit('status-update', 'Handshake completed. Connection active.');
                    }
                }
                else if (data.candidate) {
                    await this.rtc.handleRemoteIceCandidate(data.candidate);
                }
            }
            catch (error) {
                console.error('SDK Handshake Error:', error);
                this.emit('error', error);
            }
        });
        // Catch 'peer-joined' from the server, and kick off the WebRTC offer pipeline
        // this.signaling.on('peer-joined', async (data: { socketID: string; userID: string }) => {
        //   this.emit('status-update', `Peer ${data.userID} detected. Initiating WebRTC Handshake...`);
        //   await this.createCallOffer(data.socketID);
        // });
        // telehealth-sdk/src/index.ts -> inside orchestrateEvents()
        // Catch 'peer-joined' from the server, and kick off the WebRTC offer pipeline!
        this.signaling.on('peer-joined', async (data) => {
            // ✅ Call the newly exposed method cleanly
            const mySocketId = this.signaling.getSocketID();
            // 🛡️ PERFECT NEGOTIATION: Only initiate the offer if your socket ID is alphabetically greater.
            // This completely eliminates glare because exactly ONE peer will take ownership of initiating.
            if (mySocketId && mySocketId < data.socketID) {
                this.emit('status-update', `Peer detected. Standing by for incoming handshake...`);
                return;
            }
            this.emit('status-update', `Peer ${data.userID} detected. Initiating WebRTC Handshake...`);
            // Use the socketID sent by the server to target the connection offer
            await this.createCallOffer(data.socketID);
        });
    }
    // ─── PUBLIC API ─────────────────────────────────────────────────────────────
    /**
     * Enable background blur. Call before startCall().
     * If called mid-call, takes effect on next startCall().
     *
     * @param options - BlurOptions (blurRadius, fps, modelSelection)
     */
    enableBackgroundBlur(options = {}) {
        this.blurEnabled = true;
        this.blurOptions = options;
        this.emit('status-update', 'Background blur enabled.');
    }
    /**
     * Disable background blur and release processor resources.
     */
    disableBackgroundBlur() {
        this.blurEnabled = false;
        if (this.blurProcessor) {
            this.blurProcessor.destroy();
            this.blurProcessor = null;
        }
        this.emit('status-update', 'Background blur disabled.');
    }
    /**
     * High-velocity entry-point for consumer frameworks (e.g., ZenSpace)
     */
    async startCall(token, signalingUrl) {
        if (typeof window === 'undefined') {
            throw new Error('startCall can only be executed in browser contexts.');
        }
        const targetUrl = signalingUrl || this.config.serverUrl;
        const effectiveToken = token || `mock_dev_token_${Date.now()}`;
        try {
            let localStream = await this.media.captureLocalStream();
            if (this.blurEnabled) {
                this.emit('status-update', 'Initializing background blur...');
                try {
                    this.blurProcessor = new BackgroundBlurProcessor(this.blurOptions);
                    localStream = await this.blurProcessor.process(localStream);
                    this.media.setStream(localStream);
                    this.emit('status-update', 'Background blur active.');
                }
                catch (err) {
                    console.error('[MediaDance] Blur init failed, falling back to raw stream:', err);
                    this.emit('status-update', 'Background blur unavailable — using raw stream.');
                    // fall through with raw stream
                }
            }
            this.emit('local-stream-ready', localStream);
            this.emit('status-update', 'Hardware audio/video tracks acquired.');
            this.emit('status-update', 'Authenticating with infrastructure...');
            await this.signaling.connect(effectiveToken, targetUrl);
            this.signaling.emitEvent('join-room', {});
            this.emit('status-update', 'Room allocation locked. Awaiting peer...');
            return localStream;
        }
        catch (error) {
            const platformError = new MediaDanceError(`Hardware/Signaling Initialization Failed`, 'MEDIA_HARDWARE_ACQUISITION_FAILED');
            this.emit('error', platformError);
            throw platformError;
        }
    }
    /**
     * Generates and transmits an initial WebRTC offer to a newly joined peer.
     */
    async createCallOffer(targetSocketId) {
        try {
            this.emit('status-update', 'Initializing peer connection pipeline...');
            const localStream = this.media.getStream();
            const pc = this.rtc.initiateConnection(targetSocketId, localStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.signaling.emitEvent('signal-ice-sdp', {
                targetSocketID: targetSocketId,
                sdp: offer
            });
            // 💡 INITIATOR SIDE: Spawning peer offer. Mount tracking to protect background ambient nodes!
            this.initializeBitrateTracking(pc);
            this.emit('status-update', 'Outgoing WebRTC connection offer transmitted.');
        }
        catch (error) {
            console.error('SDK failed to generate call offer:', error);
            this.emit('error', error);
        }
    }
    /**
     * Private tracking bootsmith. Ensures stats are captured cleanly.
     */
    initializeBitrateTracking(pc) {
        if (this.bitrateAdapter)
            this.bitrateAdapter.stop();
        this.bitrateAdapter = new BitrateAdapter(pc, {
            pollInterval: 2000,
            rttThresholdMs: 250,
            lossThresholdPct: 5
        });
        this.bitrateAdapter.start();
        this.emit('status-update', 'Network quality monitor active. Audio lane guarded.');
    }
    // Easy abstraction cleanups
    muteAudio(isMuted) { this.media.toggleTrack('audio', !isMuted); }
    muteVideo(isMuted) { this.media.toggleTrack('video', !isMuted); }
    /**
     * Explicitly closes networking channels and gives OS back mic/cam resources.
     */
    leave() {
        if (this.bitrateAdapter) {
            this.bitrateAdapter.stop();
            this.bitrateAdapter = null;
        }
        // Explicitly shut down local devices so hardware lights go dark cleanly
        const stream = this.media.getStream();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.blurProcessor?.destroy();
        this.blurProcessor = null;
        if (this.signaling)
            this.signaling.disconnect();
        this.emit('status-update', 'Session gracefully terminated.');
    }
}
//# sourceMappingURL=index.js.map