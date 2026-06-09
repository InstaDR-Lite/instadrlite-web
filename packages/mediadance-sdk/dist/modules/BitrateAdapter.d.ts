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
export declare class BitrateAdapter {
    private pc;
    private intervalId;
    currentTier: 'high' | 'medium' | 'low';
    private config;
    constructor(peerConnection: RTCPeerConnection, options?: BitrateAdapterOptions);
    /**
     * Starts the telemetry polling loop
     */
    start(): void;
    /**
     * Cleans up the background interval when the call ends
     */
    stop(): void;
    /**
     * Evaluates network health based on inbound/outbound WebRTC telemetry
     */
    private monitorNetwork;
    /**
     * Injects hardware constraints & bitrate ceilings directly into the media sender pipelines
     */
    private applyBitrateProfile;
}
//# sourceMappingURL=BitrateAdapter.d.ts.map