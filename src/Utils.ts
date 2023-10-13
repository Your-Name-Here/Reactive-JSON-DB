export class Observable<T> {
    private subscribers: ((data: T) => void)[] = [];

    subscribe(subscriber: (data: T) => void) {
      this.subscribers.push(subscriber);
    }

    unsubscribe(subscriber: (data: T) => void) {
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    }

    notify(data: T) {
      this.subscribers.forEach((subscriber) => {
        subscriber(data);
      });
    }
}
// For usage in insert and update methods to ensure that only one operation is performed at a time.
export class Mutex {
    private isLocked: boolean = false;
    private queue: (() => void)[] = [];

    async lock(): Promise<void> {
      return new Promise<void>((resolve) => {
        if (!this.isLocked) {
          this.isLocked = true;
          resolve();
        } else {
          this.queue.push(resolve);
        }
      });
    }

    unlock(): void {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) {
          next();
        }
      } else {
        this.isLocked = false;
      }
    }
}