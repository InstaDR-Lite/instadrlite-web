export type EventCallback = (...args: any[]) => void;
export declare class EventEmitter {
    protected listeners: Map<string, EventCallback[]>;
    on(event: string, callback: EventCallback): void;
    off(event: string, callback: EventCallback): void;
    protected emit(event: string, ...args: any[]): void;
}
//# sourceMappingURL=EventEmitter.d.ts.map