export class MediaDanceError extends Error {
    code;
    severity;
    timestamp;
    constructor(message, code, severity = 'FATAL') {
        super(message);
        this.name = 'MediaDanceError';
        this.code = code;
        this.severity = severity;
        this.timestamp = new Date();
        // Restore correct prototype chain for custom errors in TS
        Object.setPrototypeOf(this, MediaDanceError.prototype);
    }
}
//# sourceMappingURL=errors.js.map