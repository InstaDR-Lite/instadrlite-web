import { EventEmitter } from '../utils/EventEmitter.js';
export class WebRTCManager extends EventEmitter {
    iceServers;
    pc = null;
    constructor(iceServers) {
        super();
        this.iceServers = iceServers;
    }
    initiateConnection(targetSocketId, localStream) {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
        // Inside your PeerConnection initialization (e.g., right before connecting signaling)
        // this.pc.addTransceiver('audio', { direction: 'sendrecv' });
        // this.pc.addTransceiver('video', { direction: 'sendrecv' });
        if (localStream) {
            localStream.getTracks().forEach((track) => this.pc.addTrack(track, localStream));
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
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.emit('ice-candidate-generated', { target: targetSocketId, candidate: event.candidate });
            }
        };
        this.pc.onconnectionstatechange = () => {
            console.log('[WebRTCManager] 📡 Connection state changed to:', this.pc?.connectionState);
            if (this.pc?.connectionState === 'connected') {
                // Expose this up to your main client wrapper
                this.emit('connection-established');
            }
        };
        this.pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.emit('remote-stream-ready', event.streams[0]);
            }
        };
        return this.pc;
    }
    getPeerConnection() {
        return this.pc;
    }
    // telehealth-sdk/src/managers/WebRTCManager.ts
    /**
     * Processes incoming Session Descriptions (Offers/Answers) from a remote peer
     */
    async handleRemoteDescription(targetSocketId, sdp, localStream) {
        // If a connection doesn't exist yet for this peer, initialize it as the receiver (isInitiator = false)
        if (!this.pc) {
            this.initiateConnection(targetSocketId, localStream);
        }
        // 1. Set the remote party's details as our current network target
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        // 2. If it's an offer, we must automatically generate an answer to send back
        if (sdp.type === 'offer') {
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            return answer; // Return the answer so the orchestrator can emit it via socket
        }
        return null;
    }
    /**
     * Appends an incoming network routing candidate to the live pipeline
     */
    async handleRemoteIceCandidate(candidate) {
        if (this.pc) {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Successfully appended remote ICE candidate.');
        }
    }
    closeConnection() {
        if (this.pc) {
            this.pc.getSenders().forEach(sender => {
                try {
                    this.pc.removeTrack(sender);
                }
                catch (_) { }
            });
            this.pc.close();
            this.pc = null;
        }
    }
}
//# sourceMappingURL=WebRTCManager.js.map