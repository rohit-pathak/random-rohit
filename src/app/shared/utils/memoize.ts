export function memoize<T extends (...args: any[]) => any>(f: T, size = 500): T {
  const cache: Map<string, ReturnType<T>> = new Map<string, ReturnType<T>>();

  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      const result = f(...(args as Parameters<T>)) as ReturnType<T>;
      cache.set(key, result);
    }
    if (cache.size > size) {
      const toRemove = cache.keys().next().value;
      if (toRemove) {
        cache.delete(toRemove);
      }
    }
    return cache.get(key) as ReturnType<T>;
  };

  return memoized as T;
}
