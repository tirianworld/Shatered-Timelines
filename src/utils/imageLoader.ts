// Cola de precarga y decodificacion asincrona de imagenes con deduplicacion y limite de concurrencia.
type Priority = 'high' | 'low';

const loadedUrls = new Set<string>();
const inFlight = new Map<string, Promise<void>>();
const lowQueue: Array<() => void> = [];
let activeLowCount = 0;
const MAX_LOW_CONCURRENCY = 4;

const pumpLowQueue = () => {
  while (activeLowCount < MAX_LOW_CONCURRENCY && lowQueue.length > 0) {
    const startNext = lowQueue.shift();
    if (startNext) startNext();
  }
};

const loadAndDecode = (src: string, shouldDecode: boolean): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (typeof Image === 'undefined') {
      resolve();
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok) loadedUrls.add(src);
      inFlight.delete(src);
      resolve();
    };
    img.onload = () => {
      if (shouldDecode && typeof img.decode === 'function') {
        img.decode().catch(() => undefined).finally(() => finish(true));
      } else {
        finish(true);
      }
    };
    img.onerror = () => finish(false);
    img.src = src;
  });
};

export const preloadImage = (
  src: string,
  options: { priority?: Priority; decode?: boolean } = {}
): Promise<void> => {
  if (!src) return Promise.resolve();
  if (loadedUrls.has(src)) return Promise.resolve();
  const existing = inFlight.get(src);
  if (existing) return existing;

  const { priority = 'low', decode = true } = options;

  if (priority === 'high') {
    const p = loadAndDecode(src, decode);
    inFlight.set(src, p);
    return p;
  }

  const p = new Promise<void>((resolve) => {
    const run = () => {
      activeLowCount++;
      loadAndDecode(src, decode).finally(() => {
        activeLowCount = Math.max(0, activeLowCount - 1);
        pumpLowQueue();
        resolve();
      });
    };
    lowQueue.push(run);
    pumpLowQueue();
  });
  inFlight.set(src, p);
  return p;
};

export const preloadImageBatch = (
  urls: string[],
  options: { priority?: Priority; decode?: boolean } = {}
): (() => void) => {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  if (unique.length === 0) return () => undefined;

  if (options.priority === 'high') {
    unique.forEach((u) => {
      void preloadImage(u, options);
    });
    return () => undefined;
  }

  let cancelled = false;
  const schedule = () => {
    if (cancelled) return;
    unique.forEach((u) => {
      void preloadImage(u, options);
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }).requestIdleCallback(schedule, { timeout: 600 });
    return () => {
      cancelled = true;
      (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    };
  }
  const timer = setTimeout(schedule, 120);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
};
