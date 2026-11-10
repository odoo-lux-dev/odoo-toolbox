import { DragDropVerticalIcon, HelpCircleIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  type Accessor,
} from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { queryStore, resultStore, setQueryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import type { QuickDomain } from "@/types";
import { attachAutoScroll, createSortableList, reorderArray } from "@/utils/drag-drop";
import { validateDomain } from "@/utils/query-validation";

const domainError = (domain: string) => {
  const validation = validateDomain(domain);
  return validation.isValid ? null : validation.error;
};

/** `added` AND-ed with `current`; replaces `current` when either one can't be parsed. */
const combineDomains = (current: string, added: string): string => {
  const currentDomain = validateDomain(current);
  const addedDomain = validateDomain(added);
  if (!currentDomain.isValid || !addedDomain.isValid || currentDomain.domain.length === 0) {
    return added;
  }
  return JSON.stringify(["&", ...currentDomain.domain, ...addedDomain.domain]);
};

/** Help button of the domain field label, with its format help modal. */
export const DomainHelpButton = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <IconButton
        type="button"
        label={t("devtools.domain_editor.help_label")}
        title={t("devtools.domain_editor.help_label")}
        variant="ghost"
        size="xs"
        circle={false}
        class="text-ink-3 hover:text-ink"
        onClick={() => setOpen(true)}
        icon={<HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={1.8} />}
      />
      <DomainHelpModal open={open()} onClose={() => setOpen(false)} />
    </>
  );
};

const DomainHelpModal = (props: { open: boolean; onClose: () => void }) => (
  <Modal
    open={props.open}
    onClose={props.onClose}
    title={t("devtools.domain_editor.help_title")}
    size="lg"
  >
    <div class="mt-3 space-y-2 text-ui text-base-content/70 [&_code]:rounded-sm [&_code]:bg-base-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono">
      <p>
        <strong>{t("devtools.domain_editor.python_supported")}</strong>
      </p>
      <p>{t("devtools.domain_editor.format_intro")}</p>

      <div class="my-3 flex flex-col gap-3">
        <div class="space-y-2">
          <h4 class="text-ui font-semibold text-base-content">
            {t("devtools.domain_editor.json_format")}
          </h4>
          <ul class="list-disc space-y-1 ps-4">
            <li>
              <code>[["name", "ilike", "test"]]</code>
            </li>
            <li>
              <code>["&", ["active", "=", true], ["name", "!=", false]]</code>
            </li>
          </ul>
        </div>

        <div class="space-y-2">
          <h4 class="text-ui font-semibold text-base-content">
            {t("devtools.domain_editor.python_format")}
          </h4>
          <ul class="list-disc space-y-1 ps-4">
            <li>
              <code>[('name', 'ilike', 'test')]</code>
            </li>
            <li>
              <code>[('active', '=', True), ('name', '!=', False)]</code>
            </li>
          </ul>
        </div>
      </div>

      <p>{t("devtools.domain_editor.operators")}</p>
      <ul class="list-disc space-y-1 ps-4">
        <li>
          <code>"&"</code> - {t("devtools.domain_editor.and_operator")}
        </li>
        <li>
          <code>"|"</code> - {t("devtools.domain_editor.or_operator")}
        </li>
        <li>
          <code>"!"</code> - {t("devtools.domain_editor.not_operator")}
        </li>
      </ul>
      <p>
        {t("devtools.domain_editor.conditions_format")}
        <code>["field", "operator", value]</code>
      </p>
      <p>
        {t("devtools.domain_editor.common_operators")}
        <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>like</code>,{" "}
        <code>ilike</code>, <code>in</code>
      </p>
    </div>
  </Modal>
);

export const DomainEditor = (props: { placeholder?: string }) => {
  const error = createMemo(() => domainError(queryStore.domain));

  return (
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1.5">
        <div
          class={`relative textarea flex min-h-16 w-full overflow-hidden bg-surface-inset p-0 ${
            error() ? "textarea-error" : ""
          }`}
        >
          <Textarea
            value={queryStore.domain}
            onInput={(e) => setQueryStore("domain", e.currentTarget.value)}
            placeholder={props.placeholder ?? t("devtools.domain_editor.placeholder")}
            class="min-h-16 flex-1 resize-y border-0 bg-transparent px-2.5 py-1.5 font-mono text-ui/relaxed whitespace-pre shadow-none focus:shadow-none"
            wrap="off"
            spellcheck={false}
            rows={1}
            disabled={resultStore.loading}
            variant="ghost"
          />
        </div>
        <Show when={error()}>
          <div class="text-small whitespace-pre-wrap text-error-ink">{error()}</div>
        </Show>
      </div>

      <QuickDomainButtons
        onDomainSelect={(domain) =>
          setQueryStore("domain", combineDomains(queryStore.domain, domain))
        }
      />
    </div>
  );
};

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

type QuickDomainsStore = ReturnType<typeof createQuickDomains>;

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

const QuickDomainButtons = (props: { onDomainSelect: (domain: string) => void }) => {
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

const QuickDomainFormModal = (props: {
  domain: QuickDomain | null;
  onSave: (data: { name: string; domain: string }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = createSignal(props.domain?.name ?? "");
  const [domainValue, setDomainValue] = createSignal(props.domain?.domain ?? "");
  const error = createMemo(() => domainError(domainValue()));
  const canSave = () => name().trim() && domainValue().trim() && !error();

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (canSave()) props.onSave({ name: name().trim(), domain: domainValue().trim() });
  };

  return (
    <Modal
      open
      onClose={props.onCancel}
      title={
        props.domain
          ? t("devtools.domain_editor.edit_title")
          : t("devtools.domain_editor.add_title")
      }
      size="lg"
      boxClass="border border-base-300"
      footer={
        <>
          <Button variant="outline" color="error" size="sm" onClick={props.onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="quick-domain-form"
            color="primary"
            size="sm"
            disabled={!canSave()}
          >
            {props.domain
              ? t("devtools.domain_editor.update_domain")
              : t("devtools.domain_editor.add_domain")}
          </Button>
        </>
      }
    >
      <form id="quick-domain-form" class="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField label={t("devtools.domain_editor.name")} required class="gap-2">
          <Input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder={t("devtools.domain_editor.name_placeholder")}
            class="input-bordered input-sm"
            fullWidth
            required
          />
        </FormField>

        <FormField label={t("devtools.sidebar.domain")} required class="gap-2">
          <Textarea
            value={domainValue()}
            onInput={(e) => setDomainValue(e.currentTarget.value)}
            placeholder={t("devtools.domain_editor.domain_placeholder")}
            class="textarea-bordered font-mono textarea-sm"
            rows={3}
            fullWidth
            color={error() && domainValue() ? "error" : undefined}
            required
          />
          <Show when={domainValue() && error()}>
            <div class="text-ui text-error">{error()}</div>
          </Show>
        </FormField>
      </form>
    </Modal>
  );
};

const DropIndicator = (props: { edge: "top" | "bottom" }) => (
  <div
    class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary"
    style={{ top: props.edge === "top" ? "-5px" : "calc(100% + 3px)" }}
  />
);

const QuickDomainManager = (props: {
  open: boolean;
  store: QuickDomainsStore;
  onClose: () => void;
  onDomainSelect: (domain: string) => void;
}) => {
  /** Domain being edited (`null` for a new one); the form is shown while set. */
  const [editing, setEditing] = createSignal<{ domain: QuickDomain | null } | null>(null);
  const domains = props.store.domains;

  const handleSave = async (data: { name: string; domain: string }) => {
    await props.store.save(data, editing()?.domain ?? null);
    setEditing(null);
  };

  const handleDomainClick = (domain: string) => {
    props.onDomainSelect(domain);
    props.onClose();
  };

  const sortable = createSortableList({
    type: "quickDomain",
    onReorder: (fromIndex, toIndex, position) =>
      props.store.reorder(reorderArray(domains(), fromIndex, toIndex, position)),
  });

  const SortableRow = (rowProps: { domain: QuickDomain; index: Accessor<number> }) => {
    let rowEl!: HTMLDivElement;
    let handleEl!: HTMLDivElement;
    const item = sortable.useItem(rowProps.index);
    onMount(() => onCleanup(item.attach(rowEl, handleEl)));
    const dropEdge = () => {
      const target = sortable.dropTarget();
      return target?.index === rowProps.index() ? target.edge : null;
    };
    return (
      <div
        ref={(el) => (rowEl = el)}
        class="relative"
        classList={{ "opacity-40": item.isDragging() }}
      >
        <div class="flex items-center gap-1">
          <div
            ref={(el) => (handleEl = el)}
            class="cursor-grab text-base-content/40 hover:text-base-content active:cursor-grabbing"
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
          </div>
          <div class="flex-1">
            <QuickDomainRow
              domain={rowProps.domain}
              onDomainClick={handleDomainClick}
              onEdit={(domain) => setEditing({ domain })}
              onDelete={props.store.remove}
            />
          </div>
        </div>
        <Show when={dropEdge()}>{(edge) => <DropIndicator edge={edge()} />}</Show>
      </div>
    );
  };

  return (
    <>
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t("devtools.domain_editor.manager_title")}
        size="xl"
        boxClass="border border-base-300 max-w-3xl"
      >
        <Show
          when={!props.store.loading()}
          fallback={
            <div class="flex h-[40vh] items-center justify-center text-sm text-base-content/60">
              {t("devtools.domain_editor.loading_domains")}
            </div>
          }
        >
          <div class="flex h-[70vh] flex-col">
            <div class="flex items-center justify-between">
              <Button
                onClick={() => setEditing({ domain: null })}
                color="accent"
                variant="outline"
                class="my-3 w-full"
                size="sm"
              >
                {t("devtools.domain_editor.add_domain")}
              </Button>
            </div>

            <div class="flex-1 overflow-hidden">
              <div
                class="flex h-full flex-col gap-2 overflow-y-auto pe-1 pt-2"
                ref={(el) => onMount(() => onCleanup(attachAutoScroll(el)))}
              >
                <For
                  each={domains()}
                  fallback={
                    <div class="py-10 text-center text-sm text-base-content/60">
                      <p class="mb-2 font-medium text-base-content">
                        {t("devtools.domain_editor.no_domains")}
                      </p>
                      <p>{t("devtools.domain_editor.no_domains_hint")}</p>
                    </div>
                  }
                >
                  {(domain, index) => <SortableRow domain={domain} index={index} />}
                </For>
              </div>
            </div>
          </div>
        </Show>
      </Modal>
      <Show when={editing()}>
        {(target) => (
          <QuickDomainFormModal
            domain={target().domain}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Show>
    </>
  );
};

const QuickDomainRow = (props: {
  domain: QuickDomain;
  onDomainClick: (domain: string) => void;
  onEdit: (domain: QuickDomain) => void;
  onDelete: (domainId: string) => void;
}) => (
  <div class="py-0.5">
    <div class="flex items-center gap-3 rounded-md border border-base-300 bg-base-200 p-3">
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-semibold text-base-content">{props.domain.name}</div>
        <div
          title={props.domain.domain}
          class="truncate text-ui/relaxed break-all text-base-content/70"
        >
          {props.domain.domain}
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Button
          onClick={() => props.onDomainClick(props.domain.domain)}
          variant="outline"
          color="primary"
          size="sm"
          title={t("devtools.domain_editor.use_hint")}
        >
          {t("common.use")}
        </Button>
        <Button
          onClick={() => props.onEdit(props.domain)}
          variant="outline"
          color="secondary"
          size="sm"
          title={t("devtools.domain_editor.edit_hint")}
        >
          {t("common.edit")}
        </Button>
        <Button
          onClick={() => props.onDelete(props.domain.id)}
          variant="outline"
          color="error"
          size="sm"
          title={t("devtools.domain_editor.delete_hint")}
        >
          {t("common.delete")}
        </Button>
      </div>
    </div>
  </div>
);
