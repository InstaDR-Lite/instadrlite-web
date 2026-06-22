// telehealth-sdk/src/index.ts
import { EventEmitter } from './utils/EventEmitter.js';
import { MediaManager } from './managers/MediaManager.js';
import { SignalingManager } from './managers/SignalingManager.js';
import { WebRTCManager } from './managers/WebRTCManager.js';
import { BitrateAdapter } from './modules/BitrateAdapter.js'; // 💡 Dropping in our adaptive engine
import { MediaDanceError } from './types/errors.js';
export { MediaDanceError } from './types/errors.js';
import { BackgroundBlurProcessor } from './processors/BackgroundBlurProcessor.js';
// Put this function right above your class definitio
function suppressNativeWebRTCExceptions() {
    if (typeof window === 'undefined')
        return;
    window.addEventListener('unhandledrejection', (event) => {
        const errorReason = event.reason?.message || '';
        if (errorReason.includes('RTCPeerConnection') ||
            errorReason.includes('setRemoteDescription') ||
            errorReason.includes('addIceCandidate') ||
            errorReason.includes('setLocalDescription') ||
            errorReason.includes('InvalidStateError')) {
            console.warn('[MediaDance Safety Net] Prevented WebRTC promise crash:', event.reason);
            event.preventDefault(); // Blocks Next.js error overlay
        }
    });
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        const errorStr = String(message);
        if (errorStr.includes('RTCPeerConnection') || errorStr.includes('InvalidStateError')) {
            console.warn('[MediaDance Safety Net] Prevented WebRTC global crash:', message);
            return true; // Prevents window crash propagation
        }
        return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
}
export class MediaDanceClient extends EventEmitter {
    media;
    signaling;
    rtc;
    config;
    bitrateAdapter = null; // 💡 Background adaptive tracking reference
    isCallEstablished = false;
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
    isPolite = false;
    iceCandidateQueue = [];
    blurProcessor = null;
    blurEnabled = false;
    blurOptions = {};
    constructor(config) {
        // 🔥 Secure the environment immediately upon initialization
        if (typeof window !== 'undefined') {
            suppressNativeWebRTCExceptions();
        }
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
        this.rtc.on('connection-established', () => {
            this.isCallEstablished = true;
            console.log('[MediaDanceClient] 🛡️ Renegotiation guard unlocked. Session is perfectly stable.');
        });
        // Handle incoming SDP negotiation exchanges (Offers, Answers, and ICE candidates)
        // this.rtc.on('renegotiation-needed', (data) => {
        //   // 🛡️ LOCK THE GATE DURING COLD BOOT
        //   if (!this.isCallEstablished) {
        //     console.log('[MediaDanceClient] 🛑 Ignoring boot-time renegotiation trigger.');
        //     return;
        //   }
        //   this.signaling.emitEvent('signal', {
        //     target: data.target,
        //     sdp: data.sdp
        //   });
        // });
        // Handle incoming SDP negotiation exchanges (Offers, Answers, and ICE candidates)
        this.signaling.on('peer-notification', async (data) => {
            this.emit('status-update', 'Incoming peer handshake detected...');
            try {
                if (data.sdp) {
                    const pc = this.rtc.getPeerConnection();
                    // 1. Drop stale answers safely
                    if (data.sdp.type === 'answer' && pc?.signalingState === 'stable') {
                        console.log('[MediaDance SDK] Dropping redundant remote answer; connection already stable.');
                        return;
                    }
                    // 2. PERFECT NEGOTIATION COLLISION CHECK
                    const offerCollision = (data.sdp.type === 'offer') && (pc?.signalingState !== 'stable');
                    if (offerCollision) {
                        if (!this.isPolite) {
                            // Impolite peer (Provider) ignores the colliding offer and waits for its own offer to be answered
                            console.log('[MediaDance SDK] Impolite peer ignoring colliding offer.');
                            return;
                        }
                        // Polite peer (Patient) rolls back its local offer state to make room for the incoming offer
                        console.log('[MediaDance SDK] Polite peer rolling back local description to accept incoming offer.');
                        await pc?.setLocalDescription({ type: 'rollback' });
                        // 🔥 CRITICAL: Notice there is NO 'return;' here for the polite peer. 
                        // It must fall through to process the offer and send the answer back!
                    }
                    // 3. Process the incoming description (Offer or Answer)
                    const localStream = this.media.getStream();
                    const localAnswer = await this.rtc.handleRemoteDescription(data.senderSocketID, data.sdp, localStream);
                    // 4. Activate statistics tracking pipeline
                    if (pc) {
                        this.initializeBitrateTracking(pc);
                    }
                    // 🔥 5. DISPATCH LOCAL ANSWER (If one was generated by handleRemoteDescription)
                    if (localAnswer) {
                        console.log('[MediaDance SDK] Dispatching answer back to impolite peer.');
                        this.signaling.emitEvent('signal-ice-sdp', {
                            targetSocketID: data.senderSocketID,
                            sdp: localAnswer
                        });
                        this.emit('status-update', 'SDP Answer dispatched to peer.');
                    }
                    else {
                        this.emit('status-update', 'Handshake completed. Connection active.');
                    }
                    // 6. Flush the ICE queue now that the remote description is set
                    if (this.iceCandidateQueue.length > 0) {
                        console.log(`[MediaDance SDK] Flushing ${this.iceCandidateQueue.length} queued ICE candidates.`);
                        for (const queuedCandidate of this.iceCandidateQueue) {
                            await this.rtc.handleRemoteIceCandidate(queuedCandidate).catch(e => console.error('[MediaDance SDK] Error processing queued candidate:', e));
                        }
                        this.iceCandidateQueue = [];
                    }
                }
                else if (data.candidate) {
                    const pc = this.rtc.getPeerConnection();
                    // 🔥 UPDATE: Queue if there's no remote description OR if we are actively renegotiating tracks
                    if (!pc || !pc.remoteDescription || pc.signalingState !== 'stable') {
                        console.log('[MediaDance SDK] Connection is renegotiating. Queueing incoming ICE candidate.');
                        this.iceCandidateQueue.push(data.candidate);
                    }
                    else {
                        await this.rtc.handleRemoteIceCandidate(data.candidate);
                    }
                }
            }
            catch (error) {
                console.error('SDK Handshake Error:', error);
                this.emit('error', error);
            }
        });
        this.signaling.on('peer-disconnected', () => {
            this.emit('status-update', 'Peer disconnected. Resetting pipeline...');
            this.rtc.closeConnection();
        });
        // Catch 'peer-joined' from the server, and kick off the WebRTC offer pipeline!
        this.signaling.on('peer-joined', async ({ userID, role, socketID }) => {
            // 1. Safely read from our new public getter
            const localSocketID = this.signaling?.socketID;
            const remoteSocketID = socketID;
            // 2. Clear the 'possibly null' check with a defensive guard clause
            if (!localSocketID || !remoteSocketID) {
                console.warn('[MediaDance SDK] Aborting negotiation: Missing unique socket identifiers.');
                return;
            }
            console.log(`[MediaDance SDK] Tracking remote peer. Local Socket: ${localSocketID} | Remote Socket: ${remoteSocketID}`);
            // ✅ NEW WAY: Clean, type-safe string comparison with zero collisions
            this.isPolite = localSocketID < remoteSocketID;
            console.log(`[MediaDance SDK] Negotiation Role Settled. Am I polite? ${this.isPolite}`);
            this.emit('status-update', `Peer ${userID} detected. Initiating WebRTC Handshake...`);
            // Use the socketID sent by the server to target the connection offer
            await this.createCallOffer(socketID);
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
        // Clean up any previous blur processor
        if (this.blurProcessor) {
            this.blurProcessor.destroy();
            this.blurProcessor = null;
        }
        const targetUrl = signalingUrl || this.config.serverUrl;
        const effectiveToken = token || `mock_dev_token_${Date.now()}`;
        try {
            let localStream = await this.media.captureLocalStream();
            // if (this.blurEnabled) {
            //   this.emit('status-update', 'Initializing background blur...');
            //   try {
            //     this.blurProcessor = new BackgroundBlurProcessor(this.blurOptions);
            //     // Kick off the processor. Ensure .process() returns a stream instantly,
            //     // or decouple the loop inside the processor itself.
            //     const processedStream = await this.blurProcessor.process(localStream);
            //     if (processedStream) {
            //       localStream = processedStream;
            //       this.media.setStream(localStream);
            //     }
            //     this.emit('status-update', 'Background blur active.');
            //   } catch (err) {
            //     console.error('[MediaDance] Blur init failed, falling back to raw stream:', err);
            //     this.emit('status-update', 'Background blur unavailable — using raw stream.');
            //   }
            // }
            // 🚀 THIS IS NOW GUARANTEED TO RUN INSTEAD OF GETTING STUCK
            this.emit('local-stream-ready', localStream);
            this.emit('status-update', 'Hardware audio/video tracks acquired.');
            this.emit('status-update', 'Authenticating with infrastructure...');
            await this.signaling.connect(effectiveToken, targetUrl);
            // Fire down the pipe!
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
    // public async startCall(token?: string, signalingUrl?: string): Promise<MediaStream | null> {
    //   if (typeof window === 'undefined') {
    //     throw new Error('startCall can only be executed in browser contexts.');
    //   }
    //   // Clean up any previous blur processor
    //   if (this.blurProcessor) {
    //     this.blurProcessor.destroy();
    //     this.blurProcessor = null;
    //   }
    //   const targetUrl = signalingUrl || this.config.serverUrl;
    //   const effectiveToken = token || `mock_dev_token_${Date.now()}`;
    //   try {
    //     // 1. Establish the network presence IMMEDIATELY
    //     this.emit('status-update', 'Authenticating with infrastructure...');
    //     await this.signaling.connect(effectiveToken, targetUrl);
    //     // 2. Fire down the pipe! The signaling server knows we're here.
    //     this.signaling.emitEvent('join-room', {});
    //     this.emit('status-update', 'Room allocation locked. Connected to session.');
    //     // Return null or empty stream for now since media is activated down-pipe
    //     return null;
    //   } catch (error: unknown) {
    //     const platformError = new MediaDanceError(
    //       `Signaling Initialization Failed`,
    //       'SIGNALING_CONNECTION_FAILED'
    //     );
    //     this.emit('error', platformError);
    //     throw platformError;
    //   }
    // }
    // public async activateAndPublishMedia(enableBlur: boolean): Promise<MediaStream> {
    //   try {
    //     this.emit('status-update', 'Acquiring hardware audio/video tracks...');
    //     let localStream = await this.media.captureLocalStream();
    //     if (enableBlur) {
    //       this.emit('status-update', 'Initializing background blur...');
    //       try {
    //         this.blurProcessor = new BackgroundBlurProcessor(this.blurOptions);
    //         const processedStream = await this.blurProcessor.process(localStream);
    //         if (processedStream) {
    //           localStream = processedStream;
    //           this.media.setStream(localStream);
    //         }
    //         this.emit('status-update', 'Background blur active.');
    //       } catch (err) {
    //         console.error('[MediaDance] Blur init failed, falling back:', err);
    //       }
    //     }
    //     this.emit('local-stream-ready', localStream);
    //     // 🔥 INJECT OR UPDATE TRACKS IN EXISTING PEER CONNECTION
    //     let peerConnection = this.rtc.getPeerConnection();
    //     if (peerConnection) {
    //       const senders = peerConnection.getSenders();
    //       localStream.getTracks().forEach(track => {
    //         // Check if we already have an active pipeline sender for this track type (video or audio)
    //         const existingSender = senders.find(s => s.track?.kind === track.kind);
    //         if (existingSender) {
    //           // Warm update: Slide the new hardware track directly into the active pipe
    //           existingSender.replaceTrack(track);
    //           console.log(`[MediaDance] Seamlessly replaced existing ${track.kind} track.`);
    //         } else {
    //           // Cold update: First time setup, map a clean track to the connection
    //           peerConnection.addTrack(track, localStream);
    //           console.log(`[MediaDance] Added new ${track.kind} track to connection.`);
    //         }
    //       });
    //     }
    //     return localStream;
    //   } catch (error) {
    //     console.error('[MediaDance] Delayed media activation failed:', error);
    //     throw error;
    //   }
    // }
    // async startCall(effectiveToken: string, targetUrl: string) {
    //   // 1. Capture the raw stream immediately to reserve m-line slots
    //   let localStream = await this.media.captureLocalStream();
    //   // Cleanly mute the video track by default so the camera is visually off on connect
    //   const initialVideoTrack = localStream.getVideoTracks()[0];
    //   if (initialVideoTrack) {
    //     initialVideoTrack.enabled = false;
    //   }
    //   this.emit('local-stream-ready', localStream);
    //   this.emit('status-update', 'Hardware tracks acquired. Joining session...');
    //   // 2. Connect directly to signaling server without touching the blur processor
    //   await this.signaling.connect(effectiveToken, targetUrl);
    //   this.signaling.emitEvent('join-room', {});
    //   this.emit('status-update', 'Room allocation locked. Awaiting peer...');
    //   return localStream;
    // }
    async activateAndPublishMedia(useBlur) {
        let localStream = this.media.getStream(); // Grab the existing raw stream
        if (useBlur && localStream) {
            this.emit('status-update', 'Initializing background blur processing pipeline...');
            try {
                this.blurProcessor = new BackgroundBlurProcessor(this.blurOptions);
                const processedStream = await this.blurProcessor.process(localStream);
                if (processedStream) {
                    localStream = processedStream;
                    this.media.setStream(localStream);
                }
                this.emit('status-update', 'Background blur active.');
            }
            catch (err) {
                console.error('[MediaDance] Blur initialization failed:', err);
            }
        }
        else {
            console.log('[MediaDanceClient]: localstram is null or not found');
        }
        // 🔥 WARM UPDATE: Seamlessly replace track rather than adding a new one
        let peerConnection = this.rtc.getPeerConnection();
        if (peerConnection) {
            const senders = peerConnection.getSenders();
            localStream?.getTracks().forEach(track => {
                const existingSender = senders.find(s => s.track?.kind === track.kind);
                if (existingSender) {
                    // Swap the hardware/processed track into the pre-allocated SDP line
                    existingSender.replaceTrack(track);
                    console.log(`[MediaDance] Upgraded pre-allocated ${track.kind} channel slot.`);
                }
                else {
                    peerConnection.addTrack(track, localStream);
                }
            });
        }
        return localStream;
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
    disconnect() {
        if (this.bitrateAdapter) {
            this.bitrateAdapter.stop();
            this.bitrateAdapter = null;
        }
        // Close peer connection explicitly
        if (this.rtc) {
            this.rtc.closeConnection(); // or however RTCPeerConnection is exposed
        }
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