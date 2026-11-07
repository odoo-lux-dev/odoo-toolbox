/**
 * Memoizes an async loader per key. A failed load is evicted so that the next call retries.
 */
export const createAsyncCache = <T>(load: (key: string) => Promise<T>) => {
  const cache = new Map<string, Promise<T>>();
  return (key: string): Promise<T> => {
    let promise = cache.get(key);
    if (!promise) {
      promise = load(key).catch((error) => {
        cache.delete(key);
        throw error;
      });
      cache.set(key, promise);
    }
    return promise;
  };
};
