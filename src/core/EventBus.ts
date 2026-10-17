import type { Unsubscribe } from '@/types';

type Handler<TPayload> = (payload: TPayload) => void;

export class EventBus<TEvents extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof TEvents, Set<Handler<never>>>();

  on<TKey extends keyof TEvents>(
    event: TKey,
    handler: Handler<TEvents[TKey]>,
  ): Unsubscribe {
    let bucket = this.handlers.get(event);
    if (!bucket) {
      bucket = new Set();
      this.handlers.set(event, bucket);
    }
    bucket.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  once<TKey extends keyof TEvents>(
    event: TKey,
    handler: Handler<TEvents[TKey]>,
  ): Unsubscribe {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  off<TKey extends keyof TEvents>(
    event: TKey,
    handler: Handler<TEvents[TKey]>,
  ): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const bucket = this.handlers.get(event);
    if (!bucket) return;
    for (const handler of [...bucket]) {
      (handler as Handler<TEvents[TKey]>)(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}