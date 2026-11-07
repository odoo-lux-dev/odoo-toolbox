import { Logger } from "@/services/logger";
import { bySequence, createSyncedStore, resequence } from "@/services/synced-store";
import type { QuickDomain } from "@/types";
import { CHROME_STORAGE_QUICK_DOMAINS_KEY } from "@/utils/constants";
import { t } from "@/utils/i18n-page";

const store = createSyncedStore<QuickDomain[]>(CHROME_STORAGE_QUICK_DOMAINS_KEY, {
  init: () => [],
  normalize: bySequence((domain) => domain.id),
  sync: {
    init: () => [
      {
        id: "active-records",
        name: t("services.quick_domains.active_records"),
        domain: '[["active", "=", true]]',
        sequence: 0,
      },
      {
        id: "all-records",
        name: t("services.quick_domains.all_records"),
        domain: '["|", ("active", "=", True), ("active", "=", False)]',
        sequence: 1,
      },
    ],
  },
});

/** Domains saved by the user in the DevTools domain editor. */
export const quickDomainsService = {
  ...store,

  async addQuickDomain(domain: Omit<QuickDomain, "id" | "sequence">): Promise<void> {
    const domains = await store.get();
    const id = `domain-${Date.now()}`;
    await store.set([{ ...domain, id, sequence: domains.length }, ...domains]);
  },

  async updateQuickDomain(
    domainId: string,
    updates: Partial<Omit<QuickDomain, "id">>,
  ): Promise<void> {
    const domains = await store.get();
    if (!domains.some((d) => d.id === domainId)) {
      throw new Error(t("services.quick_domains.not_found", [domainId]));
    }
    await store.set(domains.map((d) => (d.id === domainId ? { ...d, ...updates } : d)));
  },

  async deleteQuickDomain(domainId: string): Promise<void> {
    const domains = await store.get();
    const remaining = domains.filter((domain) => domain.id !== domainId);
    if (remaining.length === domains.length) {
      Logger.warn(`Quick domain with ID "${domainId}" not found for deletion`);
      return;
    }
    await store.set(remaining);
  },

  reorderQuickDomains: (orderedDomains: QuickDomain[]) => store.set(resequence(orderedDomains)),
};
