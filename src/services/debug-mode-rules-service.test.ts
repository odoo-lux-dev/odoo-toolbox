import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import { memoryStorage, resetStorage } from "../../tests/setup";

const { MAX_ODOO_HOSTS, debugModeRulesService } =
  await import("@/services/debug-mode-rules-service");
const { settingsService } = await import("@/services/settings-service");
const { buildDebugModeRules } = await import("@/utils/debug-mode-rules");

const KEY = "local:odooHosts";
const hostNames = (count: number) => Array.from({ length: count }, (_, i) => `h${i}.example.com`);

beforeEach(resetStorage);

describe("debugModeRulesService.rememberHost", () => {
  test("puts the last visited host first, without duplicates", async () => {
    await debugModeRulesService.rememberHost("a.example.com");
    await debugModeRulesService.rememberHost("b.example.com");
    await debugModeRulesService.rememberHost("a.example.com");
    expect(memoryStorage.get(KEY)).toEqual(["a.example.com", "b.example.com"]);
  });

  test("keeps a host visited again before the list overflows", async () => {
    const hosts = hostNames(MAX_ODOO_HOSTS);
    const oldest = hosts[MAX_ODOO_HOSTS - 1];
    memoryStorage.set(KEY, hosts);

    await debugModeRulesService.rememberHost(oldest);
    await debugModeRulesService.rememberHost("new.example.com");

    const stored = memoryStorage.get(KEY) as string[];
    expect(stored).toHaveLength(MAX_ODOO_HOSTS);
    expect(stored).toContain(oldest);
    expect(stored).not.toContain(hosts[MAX_ODOO_HOSTS - 2]);
  });

  test("drops the oldest host when a new one exceeds the limit", async () => {
    const hosts = hostNames(MAX_ODOO_HOSTS);
    memoryStorage.set(KEY, hosts);

    await debugModeRulesService.rememberHost("new.example.com");

    const stored = memoryStorage.get(KEY) as string[];
    expect(stored).toHaveLength(MAX_ODOO_HOSTS);
    expect(stored[0]).toBe("new.example.com");
    expect(stored).not.toContain(hosts[MAX_ODOO_HOSTS - 1]);
  });
});

interface Rule {
  id: number;
}

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .toSorted()
      .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
  );
};

/** Behaves as Chrome does: keys sorted and rules out of order on read, ids checked on update. */
const fakeDnr = {
  rules: [] as Rule[],
  updates: 0,
  async getDynamicRules(): Promise<Rule[]> {
    await Bun.sleep(0);
    return (sortKeys(this.rules) as Rule[]).toReversed();
  },
  async updateDynamicRules(options: { removeRuleIds: number[]; addRules: Rule[] }) {
    await Bun.sleep(0);
    const kept = this.rules.filter((rule) => !options.removeRuleIds.includes(rule.id));
    const duplicate = options.addRules.find((rule) => kept.some(({ id }) => id === rule.id));
    if (duplicate) throw new Error(`Rule with id ${duplicate.id} does not have a unique ID.`);
    this.rules = [...kept, ...structuredClone(options.addRules)];
    this.updates++;
  },
};

const settle = () => Bun.sleep(20);

const expectedRules = async () => {
  const settings = await settingsService.getSettings();
  return buildDebugModeRules({
    defaultDebugMode: settings.enableDebugMode,
    ignoredPaths: settings.ignoredDebugPaths,
    hosts: memoryStorage.get(KEY) as string[],
  });
};

const appliedRules = () => fakeDnr.rules.toSorted((a, b) => a.id - b.id);

describe("debugModeRulesService rules", () => {
  beforeAll(async () => {
    (globalThis as typeof globalThis & { browser?: unknown }).browser = {
      declarativeNetRequest: fakeDnr,
    };
    debugModeRulesService.start();
    await settle();
  });

  beforeEach(() => {
    fakeDnr.rules = [];
    fakeDnr.updates = 0;
  });

  test("applies the rules of the known hosts", async () => {
    await settingsService.set("enableDebugMode", "1");
    await settle();
    await debugModeRulesService.rememberHost("a.example.com");
    await settle();

    expect(appliedRules()).toEqual(await expectedRules());
    expect(appliedRules().length).toBeGreaterThan(0);
  });

  test("does not replace the rules when only the order of the hosts changes", async () => {
    await settingsService.set("enableDebugMode", "1");
    await settle();
    await debugModeRulesService.rememberHost("a.example.com");
    await settle();
    await debugModeRulesService.rememberHost("b.example.com");
    await settle();
    const updates = fakeDnr.updates;

    await debugModeRulesService.rememberHost("a.example.com");
    await settle();

    expect(memoryStorage.get(KEY)).toEqual(["a.example.com", "b.example.com"]);
    expect(fakeDnr.updates).toBe(updates);
  });
});
