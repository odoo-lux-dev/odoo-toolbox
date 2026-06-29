import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

const memoryStorage = new Map<string, unknown>();

mock.module("wxt/utils/storage", () => ({
  storage: {
    defineItem: (key: string, options?: { init?: () => unknown }) => ({
      getValue: async () => {
        if (!memoryStorage.has(key)) {
          memoryStorage.set(key, options?.init ? options.init() : null);
        }
        return memoryStorage.get(key);
      },
      setValue: async (value: unknown) => {
        memoryStorage.set(key, value);
      },
    }),
    watch: () => () => {},
  },
}));

export { memoryStorage };
