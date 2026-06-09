export class EventEmitter {
    listeners = new Map();
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (!callbacks)
            return;
        const filtered = callbacks.filter((cb) => cb !== callback);
        if (filtered.length === 0) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.set(event, filtered);
        }
    }
    emit(event, ...args) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((cb) => cb(...args));
        }
    }
}
//# sourceMappingURL=EventEmitter.js.map