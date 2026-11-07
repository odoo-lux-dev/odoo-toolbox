import { type StorageItemKey, storage } from "wxt/utils/storage";

interface StoreAreaOptions<T> {
  init: () => T;
  version?: number;
  migrations?: Record<number, (oldValue: any) => any>;
}

interface StoreOptions<T> extends StoreAreaOptions<T> {
  /** Applied to every value read, written or watched (ordering, deduplication, limits...). */
  normalize?: (value: T) => T;
}

/**
 * Typed `local:` storage item whose values always go through `normalize`.
 */
export const createStore = <T>(key: string, options: StoreOptions<T>) => {
  const normalize = options.normalize ?? ((value: T) => value);
  const item = storage.defineItem<T>(<StorageItemKey>`local:${key}`, {
    init: options.init,
    version: options.version ?? 1,
    migrations: options.migrations,
  });

  return {
    get: async (): Promise<T> => normalize(await item.getValue()),
    set: (value: T): Promise<void> => item.setValue(normalize(value)),
    watch: (callback: (value: T) => void): (() => void) =>
      item.watch((value) => callback(normalize(value ?? options.init()))),
  };
};

/**
 * Local store mirrored to a `sync:` item: the extension works on the local copy and the
 * background periodically persists it to the browser account.
 */
export const createSyncedStore = <T>(
  key: string,
  options: StoreOptions<T> & { sync: StoreAreaOptions<T> },
) => {
  const local = createStore(key, options);
  const syncItem = storage.defineItem<T>(<StorageItemKey>`sync:${key}`, {
    init: options.sync.init,
    version: options.sync.version ?? 1,
    migrations: options.sync.migrations,
  });

  return {
    ...local,
    getSynced: async (): Promise<T> => syncItem.getValue(),
    persistToSync: async (): Promise<void> => syncItem.setValue(await local.get()),
  };
};

interface Sequenced {
  sequence: number;
}

/** `normalize` of a list ordered by the user: keeps the last entry of each key, by sequence. */
export const bySequence =
  <T extends Sequenced>(keyOf: (item: T) => string) =>
  (items: T[]): T[] =>
    [...new Map(items.map((item) => [keyOf(item), item])).values()].toSorted(
      (a, b) => a.sequence - b.sequence,
    );

/** Renumbers the items in their current order. */
export const resequence = <T extends Sequenced>(items: T[]): T[] =>
  items.map((item, index) => ({ ...item, sequence: index }));
