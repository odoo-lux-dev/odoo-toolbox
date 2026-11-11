import { Settings02Icon } from "@hugeicons/core-free-icons";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { QuickDomainManager } from "@/screens/devtools/components/quick-domain-manager";
import { resultStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import type { QuickDomain } from "@/types";

/** Quick domains from storage, kept in sync by the storage watcher (every write goes through it). */
const createQuickDomains = () => {
  const [domains, setDomains] = createSignal<QuickDomain[]>([]);
  const [loading, setLoading] = createSignal(true);

  const load = () =>
    quickDomainsService
      .get()
      .then(setDomains)
      .catch((error) => Logger.error("Failed to load quick domains:", error))
      .finally(() => setLoading(false));

  onMount(() => {
    void load();
    onCleanup(
      quickDomainsService.watch((newDomains) => {
        if (newDomains) setDomains(newDomains);
      }),
    );
  });

  /** Runs a storage write; on failure the list is reloaded so it matches storage again. */
  const write = (operation: Promise<void>) =>
    operation.catch((error) => {
      Logger.error("Failed to save quick domains:", error);
      void load();
    });

  return {
    domains,
    loading,
    save: (domain: { name: string; domain: string }, editing: QuickDomain | null) =>
      write(
        editing
          ? quickDomainsService.updateQuickDomain(editing.id, domain)
          : quickDomainsService.addQuickDomain(domain),
      ),
    remove: (id: string) => write(quickDomainsService.deleteQuickDomain(id)),
    reorder: (reordered: QuickDomain[]) => {
      setDomains(reordered);
      return write(quickDomainsService.reorderQuickDomains(reordered));
    },
  };
};

export type QuickDomainsStore = ReturnType<typeof createQuickDomains>;

const CHIP_GAP = 8;

/** How many chips (widths in px) fit in `available`, keeping room for the "+N" chip when some don't. */
const countFittingChips = (widths: number[], overflowWidth: number, available: number) => {
  const fit = (reserved: number) => {
    let total = 0;
    let count = 0;
    for (const width of widths) {
      const next = total + Math.min(width, available) + (count > 0 ? CHIP_GAP : 0);
      if (next + reserved > available) break;
      total = next;
      count += 1;
    }
    return count;
  };
  const all = fit(0);
  return all === widths.length ? all : fit(overflowWidth + CHIP_GAP);
};

export const QuickDomainButtons = (props: { onDomainSelect: (domain: string) => void }) => {
  const store = createQuickDomains();
  const [showManager, setShowManager] = createSignal(false);
  const [maxVisible, setMaxVisible] = createSignal(Infinity);
  let rowRef: HTMLDivElement | undefined;
  let settingsRef: HTMLDivElement | undefined;
  let measurementRef: HTMLDivElement | undefined;

  const visibleDomains = createMemo(() => store.domains().slice(0, maxVisible()));
  const hiddenCount = () => store.domains().length - visibleDomains().length;

  /** Chip widths come from a hidden copy of the row (same Button markup), rendered below. */
  const measure = () => {
    if (!rowRef || !measurementRef) return;
    const available =
      rowRef.getBoundingClientRect().width - (settingsRef?.offsetWidth ?? 0) - CHIP_GAP;
    if (available <= 0) return;
    const widths = [...measurementRef.children].map((child) => (child as HTMLElement).offsetWidth);
    const overflowWidth = widths.pop() ?? 0;
    setMaxVisible(countFittingChips(widths, overflowWidth, available));
  };

  createEffect(on(store.domains, measure));
  onMount(() => {
    const observer = new ResizeObserver(measure);
    if (rowRef) observer.observe(rowRef);
    onCleanup(() => observer.disconnect());
  });

  const ManageButton = () => (
    <div ref={(el) => (settingsRef = el)} class="shrink-0">
      <IconButton
        type="button"
        label={t("devtools.domain_editor.manage_domains")}
        variant="ghost"
        size="xs"
        circle={false}
        class="text-base-content/60 hover:text-base-content"
        onClick={() => setShowManager(true)}
        disabled={resultStore.loading}
        icon={<HugeiconsIcon icon={Settings02Icon} size={14} strokeWidth={1.6} />}
      />
    </div>
  );

  return (
    <>
      <div ref={(el) => (rowRef = el)} class="relative flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-hidden">
          <Show
            when={!store.loading()}
            fallback={
              <div class="text-ui text-base-content/60">
                {t("devtools.domain_editor.loading_domains")}
              </div>
            }
          >
            <For
              each={visibleDomains()}
              fallback={
                <span class="text-ui text-base-content/60">
                  {t("devtools.domain_editor.no_domain")}
                </span>
              }
            >
              {(domain) => (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  class="max-w-full shrink-0 truncate text-base-content/70"
                  onClick={() => props.onDomainSelect(domain.domain)}
                  title={t("devtools.domain_editor.domain_value_title", [domain.domain])}
                  disabled={resultStore.loading}
                >
                  {domain.name}
                </Button>
              )}
            </For>
            <Show when={hiddenCount() > 0}>
              <Button
                type="button"
                variant="outline"
                size="xs"
                class="text-base-content/70"
                onClick={() => setShowManager(true)}
                title={t("devtools.domain_editor.show_more", [String(hiddenCount())])}
                disabled={resultStore.loading}
              >
                +{hiddenCount()}
              </Button>
            </Show>
          </Show>
        </div>
        <ManageButton />
        <div
          ref={(el) => (measurementRef = el)}
          aria-hidden="true"
          class="invisible absolute inset-s-0 top-0 flex max-w-full gap-2 overflow-hidden whitespace-nowrap"
        >
          <For each={store.domains()}>
            {(domain) => (
              <Button type="button" variant="outline" size="xs" tabIndex={-1}>
                {domain.name}
              </Button>
            )}
          </For>
          <Button type="button" variant="outline" size="xs" tabIndex={-1}>
            +{store.domains().length}
          </Button>
        </div>
      </div>
      <QuickDomainManager
        open={showManager()}
        store={store}
        onClose={() => setShowManager(false)}
        onDomainSelect={props.onDomainSelect}
      />
    </>
  );
};
