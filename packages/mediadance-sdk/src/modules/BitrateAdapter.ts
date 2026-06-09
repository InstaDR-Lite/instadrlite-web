// telehealth-sdk/src/modules/bitrateAdapter.ts

export interface BitrateTier {
  maxBitrate: number;
  scaleResolutionDownBy: number;
}

export interface BitrateAdapterOptions {
  pollInterval?: number;
  rttThresholdMs?: number;
  lossThresholdPct?: number;
}

export interface BitrateAdapterConfig {
  pollInterval: number;
  rttThresholdMs: number;
  lossThresholdPct: number;
  tiers: {
    high: BitrateTier;
    medium: BitrateTier;
    low: BitrateTier;
  };
}

export class BitrateAdapter {
  // 💡 Explicitly declare internal class state properties for TypeScript
  private pc: RTCPeerConnection;
  private intervalId: ReturnType<typeof setInterval> | null;
  public currentTier: 'high' | 'medium' | 'low';
  private config: BitrateAdapterConfig;

  constructor(peerConnection: RTCPeerConnection, options: BitrateAdapterOptions = {}) {
    // Fixes: Parameter 'peerConnection' implicitly has an 'any' type
    this.pc = peerConnection;
    this.intervalId = null;
    this.currentTier = 'high';
    
    // Core Adaptive Bitrate Configuration Tiers
    this.config = {
      pollInterval: options.pollInterval || 2000,
      rttThresholdMs: options.rttThresholdMs || 250,
      lossThresholdPct: options.lossThresholdPct || 5,
      tiers: {
        high:   { maxBitrate: 1500000, scaleResolutionDownBy: 1.0 }, // 1.5 Mbps (HD)
        medium: { maxBitrate: 600000,  scaleResolutionDownBy: 2.0 }, // 600 Kbps (SD)
        low:    { maxBitrate: 150000,  scaleResolutionDownBy: 4.0 }  // 150 Kbps (Low)
      }
    };
  }

  /**
   * Starts the telemetry polling loop
   */
  public start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.monitorNetwork(), this.config.pollInterval);
  }

  /**
   * Cleans up the background interval when the call ends
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Evaluates network health based on inbound/outbound WebRTC telemetry
   */
  private async monitorNetwork(): Promise<void> {
    if (!this.pc) return;
    
    try {
      const stats = await this.pc.getStats();
      let rtt = 0;
      let packetLossPct = 0;

      stats.forEach((report) => {
        // Capture remote inbound network health metrics from the edge gateway router
        if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
          rtt = report.roundTripTime ? report.roundTripTime * 1000 : 0; // Convert sec to ms

          if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
            const totalPackets = report.packetsLost + report.packetsReceived;
            if (totalPackets > 0) {
              packetLossPct = (report.packetsLost / totalPackets) * 100;
            }
          }
        }
      });

      // --- Adaptive State Engine Logic ---
      if (rtt > this.config.rttThresholdMs || packetLossPct > this.config.lossThresholdPct) {
        // Network degradation detected: Step down the quality ladders
        if (this.currentTier === 'high') {
          await this.applyBitrateProfile('medium');
        } else if (this.currentTier === 'medium') {
          await this.applyBitrateProfile('low');
        }
      } else if (rtt < 100 && packetLossPct < 2) {
        // Network is pristine: Safely scale back up to maximize fidelity
        if (this.currentTier === 'low') {
          await this.applyBitrateProfile('medium');
        } else if (this.currentTier === 'medium') {
          await this.applyBitrateProfile('high');
        }
      }
    } catch (err) {
      console.error('[MediaDance Engine] Error polling connection telemetry:', err);
    }
  }

  /**
   * Injects hardware constraints & bitrate ceilings directly into the media sender pipelines
   */
  private async applyBitrateProfile(tierName: 'high' | 'medium' | 'low'): Promise<void> {
    const profile = this.config.tiers[tierName];
    const senders = this.pc.getSenders();
    const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');

    if (!videoSender) return;

    try {
      const parameters = videoSender.getParameters();
      
      if (!parameters.encodings || parameters.encodings.length === 0) {
        parameters.encodings = [{}];
      }

      // Modify parameter constraints on the fly without breaking SDP negotiation lines
      parameters.encodings[0].maxBitrate = profile.maxBitrate;
      parameters.encodings[0].scaleResolutionDownBy = profile.scaleResolutionDownBy;

      await videoSender.setParameters(parameters);
      this.currentTier = tierName;
      
      console.warn(`[MediaDance Engine] Network shift detected. Active Profile: ${tierName.toUpperCase()}`);
    } catch (err) {
      console.error(`[MediaDance Engine] Failed to adapt encoding parameters to ${tierName}:`, err);
    }
  }
}