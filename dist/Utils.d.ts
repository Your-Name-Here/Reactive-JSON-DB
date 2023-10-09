export declare class Observable<T> {
    private subscribers;
    subscribe(subscriber: (data: T) => void): void;
    unsubscribe(subscriber: (data: T) => void): void;
    notify(data: T): void;
}
export declare class Mutex {
    private isLocked;
    private queue;
    lock(): Promise<void>;
    unlock(): void;
}
