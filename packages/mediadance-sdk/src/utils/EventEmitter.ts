export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    const filtered = callbacks.filter((cb) => cb !== callback);
    
    if (filtered.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filtered);
    }
  }

  protected emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}