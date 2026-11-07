import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({
  url: "http://localhost/",
  settings: {
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});

type Watcher = (newValue: unknown, oldValue: unknown) => void;

/** In-memory `wxt/utils/storage`. A stored value is migrated from `storedVersions` (default 1). */
const memoryStorage = new Map<string, unknown>();
/** Options of every `storage.defineItem` call, by key: the real WXT storage can replay them. */
const definedItems = new Map<string, StorageItemOptions>();
const storedVersions = new Map<string, number>();
const watchers = new Map<string, Set<Watcher>>();

const watch = (key: string, callback: Watcher) => {
  const keyWatchers = watchers.get(key) ?? new Set();
  keyWatchers.add(callback);
  watchers.set(key, keyWatchers);
  return () => keyWatchers.delete(callback);
};

const write = (key: string, value: unknown) => {
  const oldValue = memoryStorage.get(key) ?? null;
  memoryStorage.set(key, value);
  watchers.get(key)?.forEach((callback) => callback(value, oldValue));
};

interface StorageItemOptions {
  init?: () => unknown;
  version?: number;
  migrations?: Record<number, (value: any) => any>;
}

mock.module("wxt/utils/storage", () => ({
  storage: {
    defineItem: (key: string, options: StorageItemOptions = {}) => {
      definedItems.set(key, options);
      const targetVersion = options.version ?? 1;
      return {
        getValue: async () => {
          if (!memoryStorage.has(key)) {
            memoryStorage.set(key, options.init ? options.init() : null);
            storedVersions.set(key, targetVersion);
          }
          let version = storedVersions.get(key) ?? 1;
          while (version < targetVersion) {
            version++;
            const migrate = options.migrations?.[version];
            if (migrate) memoryStorage.set(key, migrate(memoryStorage.get(key)));
          }
          storedVersions.set(key, version);
          return memoryStorage.get(key);
        },
        setValue: async (value: unknown) => {
          storedVersions.set(key, targetVersion);
          write(key, value);
        },
        watch: (callback: Watcher) => watch(key, callback),
      };
    },
    watch,
  },
}));

const resetStorage = () => {
  memoryStorage.clear();
  storedVersions.clear();
};

export { definedItems, memoryStorage, storedVersions, resetStorage };
