import { type StorageItemKey, storage } from "wxt/utils/storage";

/** WXT runs an item's migrations once, when the item is defined: import its module afresh after this. */
export const storeAtVersion = async (key: StorageItemKey, value: unknown, version: number) => {
  await storage.setItem(key, value);
  await storage.setMeta(key, { v: version });
};
