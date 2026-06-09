export type MediaDanceErrorSeverity = 'FATAL' | 'WARNING';
export declare class MediaDanceError extends Error {
    code: string;
    severity: MediaDanceErrorSeverity;
    timestamp: Date;
    constructor(message: string, code: string, severity?: MediaDanceErrorSeverity);
}
//# sourceMappingURL=errors.d.ts.map