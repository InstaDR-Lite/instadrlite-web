import { EventEmitter } from '../utils/EventEmitter.js';
export class WebRTCManager extends EventEmitter {
    iceServers;
    peerConnection = null;
    constructor(iceServers) {
        super();
        this.iceServers = iceServers;
    }
    initiateConnection(targetSocketId, localStream) {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
        // Inside your PeerConnection initialization (e.g., right before connecting signaling)
        // this.pc.addTransceiver('audio', { direction: 'sendrecv' });
        // this.pc.addTransceiver('video', { direction: 'sendrecv' });
        if (localStream) {
            localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, localStream));
        }
        // 🔥 1. LISTEN FOR LATE TRACK INJECTIONS (STATE-SAFE)
        // this.pc.onnegotiationneeded = async () => {
        //   try {
        //     console.log('[WebRTCManager] 🔄 Track modification detected. Renegotiating...');
        //     // 🛡️ THE BULLETPROOF STATE GUARD
        //     // If the signaling state isn't perfectly stable, or if it's currently processing 
        //     // the initial handshake, block automated renegotiation to prevent m-line scrambling.
        //     if (this.pc!.signalingState !== "stable") {
        //       console.warn('[WebRTCManager] 🛑 Renegotiation blocked. Signaling state is unstable: %s', this.pc!.signalingState);
        //       return;
        //     }
        //     // Generate updated SDP offer reflecting the newly added tracks
        //     const offer = await this.pc!.createOffer();
        //     await this.pc!.setLocalDescription(offer);
        //     // Emit an event up to your client to send the offer over the socket
        //     this.emit('renegotiation-needed', { 
        //       target: targetSocketId, 
        //       sdp: this.pc!.localDescription 
        //     });
        //   } catch (err) {
        //     console.error('[WebRTCManager] Mid-session negotiation failed:', err);
        //   }
        // };
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('ice-candidate-generated', { target: targetSocketId, candidate: event.candidate });
            }
        };
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[WebRTCManager] 📡 Connection state changed to:', this.peerConnection?.connectionState);
            if (this.peerConnection?.connectionState === 'connected') {
                // Expose this up to your main client wrapper
                this.emit('connection-established');
            }
        };
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.emit('remote-stream-ready', event.streams[0]);
            }
        };
        return this.peerConnection;
    }
    getPeerConnection() {
        return this.peerConnection;
    }
    // telehealth-sdk/src/managers/WebRTCManager.ts
    /**
     * Processes incoming Session Descriptions (Offers/Answers) from a remote peer
     */
    async handleRemoteDescription(targetSocketId, sdp, localStream) {
        // If a connection doesn't exist yet for this peer, initialize it as the receiver (isInitiator = false)
        if (!this.peerConnection) {
            this.initiateConnection(targetSocketId, localStream);
        }
        // 1. Set the remote party's details as our current network target
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        // 2. If it's an offer, we must automatically generate an answer to send back
        if (sdp.type === 'offer') {
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer; // Return the answer so the orchestrator can emit it via socket
        }
        return null;
    }
    /**
     * Appends an incoming network routing candidate to the live pipeline
     */
    async handleRemoteIceCandidate(candidate) {
        if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Successfully appended remote ICE candidate.');
        }
    }
    /**
     * Checks if an active peer connection is currently established
     */
    isActive() {
        return this.peerConnection !== null && this.peerConnection.connectionState === 'connected';
    }
    /**
     * Hot-swaps the active media tracks on the live connection without renegotiating
     */
    async updateLocalTracks(newStream) {
        if (!this.peerConnection)
            return;
        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];
        const senders = this.peerConnection.getSenders();
        // 1. Locate the video sender and swap the track seamlessly via hardware layer
        if (videoTrack) {
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
                // replaceTrack handles the pipeline handoff without dropping the connection
                await videoSender.replaceTrack(videoTrack);
            }
        }
        // 2. Locate the audio sender and swap (if needed, e.g., if devices changed)
        if (audioTrack) {
            const audioSender = senders.find(s => s.track?.kind === 'audio');
            if (audioSender) {
                await audioSender.replaceTrack(audioTrack);
            }
        }
    }
    /**
     * Gracefully handles camera muting by dropping tracks on the connection
     */
    async handleVideoMute() {
        if (!this.peerConnection)
            return;
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
            await videoSender.replaceTrack(null);
        }
    }
    closeConnection() {
        if (this.peerConnection) {
            this.peerConnection.getSenders().forEach(sender => {
                try {
                    this.peerConnection.removeTrack(sender);
                }
                catch (_) { }
            });
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }
}
//# sourceMappingURL=WebRTCManager.js.map