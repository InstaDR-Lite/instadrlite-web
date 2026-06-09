export type MediaDanceErrorSeverity = 'FATAL' | 'WARNING';

export class MediaDanceError extends Error {
  public code: string;
  public severity: MediaDanceErrorSeverity;
  public timestamp: Date;

  constructor(message: string, code: string, severity: MediaDanceErrorSeverity = 'FATAL') {
    super(message);
    this.name = 'MediaDanceError';
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date();

    // Restore correct prototype chain for custom errors in TS
    Object.setPrototypeOf(this, MediaDanceError.prototype);
  }
}