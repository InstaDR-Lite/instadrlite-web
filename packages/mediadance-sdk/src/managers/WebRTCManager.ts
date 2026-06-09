import { EventEmitter } from '../utils/EventEmitter.js';

export class WebRTCManager extends EventEmitter {
  private pc: RTCPeerConnection | null = null;

  constructor(private iceServers: RTCIceServer[]) {
    super();
  }

  public initiateConnection(targetSocketId: string, localStream: MediaStream | null): RTCPeerConnection {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    if (localStream) {
      localStream.getTracks().forEach((track) => this.pc!.addTrack(track, localStream));
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice-candidate-generated', { target: targetSocketId, candidate: event.candidate });
      }
    };

    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.emit('remote-stream-ready', event.streams[0]);
      }
    };

    return this.pc;
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  // telehealth-sdk/src/managers/WebRTCManager.ts

  /**
   * Processes incoming Session Descriptions (Offers/Answers) from a remote peer
   */
  public async handleRemoteDescription(
    targetSocketId: string, 
    sdp: RTCSessionDescriptionInit, 
    localStream: MediaStream | null
  ): Promise<RTCSessionDescriptionInit | null> {
    
    // If a connection doesn't exist yet for this peer, initialize it as the receiver (isInitiator = false)
    if (!this.pc) {
      this.initiateConnection(targetSocketId, localStream);
    }

    // 1. Set the remote party's details as our current network target
    await this.pc!.setRemoteDescription(new RTCSessionDescription(sdp));

    // 2. If it's an offer, we must automatically generate an answer to send back
    if (sdp.type === 'offer') {
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      return answer; // Return the answer so the orchestrator can emit it via socket
    }

    return null;
  }

  /**
   * Appends an incoming network routing candidate to the live pipeline
   */
  public async handleRemoteIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('Successfully appended remote ICE candidate.');
    }
  }
}