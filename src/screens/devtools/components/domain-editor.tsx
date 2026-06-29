import { DragDropVerticalIcon, HelpCircleIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { createEffect, createMemo, createSignal, onCleanup, onMount, untrack } from "solid-js";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { queryStore, resultStore, setQueryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { quickDomainsService } from "@/services/quick-domains-service";
import { QuickDomain } from "@/types";
import { attachAutoScroll, createSortableList, reorderArray } from "@/utils/drag-drop";
import { validateDomain } from "@/utils/query-validation";

interface DomainEditorProps {
  placeholder?: string;
}

export const DomainEditor = (props: DomainEditorProps) => {
  const validation = createMemo(() => validateDomain(queryStore.domain));
  const isValid = createMemo(() => validation().isValid);
  const error = createMemo(() => validation().error || null);
  const [isHelpOpen, setIsHelpOpen] = createSignal(false);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const newValue = target.value;

    setQueryStore("domain", newValue);
  };

  const addCommonDomain = (domain: string) => {
    const currentValue = queryStore.domain.trim();
    let finalDomain: string;

    if (currentValue === "" || currentValue === "[]") {
      finalDomain = domain;
    } else {
      try {
        const current = JSON.parse(currentValue);
        const newDomain = JSON.parse(domain);
        const merged = ["&", ...current, ...newDomain];
        finalDomain = JSON.stringify(merged);
      } catch {
        finalDomain = domain;
      }
    }

    setQueryStore("domain", finalDomain);
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-2">
        <div class="relative">
          <Textarea
            value={queryStore.domain}
            onInput={handleChange}
            placeholder={props.placeholder ?? t("devtools.domain_editor.placeholder")}
            class="textarea-bordered textarea min-h-[60px] pe-9 font-mono textarea-sm"
            rows={1}
            disabled={resultStore.loading}
            fullWidth
            size="xs"
            color={!isValid() ? "error" : undefined}
          />
          <IconButton
            type="button"
            label={t("devtools.domain_editor.help_label")}
            variant="ghost"
            size="xs"
            class="absolute inset-e-2 top-2 text-base-content/50 hover:text-base-content"
            onClick={() => {
              setIsHelpOpen(true);
            }}
            disabled={resultStore.loading}
            icon={
              <HugeiconsIcon
                icon={HelpCircleIcon}
                size={14}
                color="currentColor"
                strokeWidth={1.8}
              />
            }
          />
        </div>
        {error() && <div class="mt-1 text-xs whitespace-pre-wrap text-error">{error()}</div>}
      </div>

      <QuickDomainButtons onDomainSelect={addCommonDomain} />

      <Modal
        open={isHelpOpen()}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        title={t("devtools.domain_editor.help_title")}
        size="lg"
      >
        <div class="mt-3 space-y-2 text-xs text-base-content/70 [&_code]:rounded-sm [&_code]:bg-base-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono">
          <p>
            <strong>{t("devtools.domain_editor.python_supported")}</strong>
          </p>
          <p>{t("devtools.domain_editor.format_intro")}</p>

          <div class="my-3 flex flex-col gap-3">
            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-base-content">
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
              <h4 class="text-xs font-semibold text-base-content">
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
            <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>like</code>
            , <code>ilike</code>, <code>in</code>
          </p>
        </div>
      </Modal>
    </div>
  );
};

interface QuickDomainButtonsProps {
  onDomainSelect: (domain: string) => void;
}

export const QuickDomainButtons = (props: QuickDomainButtonsProps) => {
  const [domains, setDomains] = createSignal<QuickDomain[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showManager, setShowManager] = createSignal(false);
  const [maxVisible, setMaxVisible] = createSignal(3);
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [measurementRef, setMeasurementRef] = createSignal<HTMLDivElement>();
  const [settingsRef, setSettingsRef] = createSignal<HTMLDivElement>();

  const visibleDomains = createMemo(() => domains().slice(0, Math.max(0, maxVisible())));
  const hiddenCount = createMemo(() => Math.max(0, domains().length - Math.max(0, maxVisible())));
  const showOverflowButton = createMemo(() => hiddenCount() > 0);

  onMount(() => {
    loadDomains();

    const unwatch = quickDomainsService.watchQuickDomainsOrdered((newDomains) => {
      if (newDomains) {
        setDomains(newDomains);
        calculateMaxVisible();
      }
    });

    onCleanup(unwatch);
  });

  createEffect(() => {
    domains();
    untrack(() => calculateMaxVisible());

    makeEventListener(window, "resize", () => setTimeout(() => calculateMaxVisible(), 100));
  });

  const calculateMaxVisible = () => {
    if (!containerRef() || !measurementRef()) {
      return;
    }

    const container = containerRef()!;
    const measurement = measurementRef()!;
    const containerWidth = container.offsetWidth;
    const gap = 8;
    const rowWidth = container.parentElement?.getBoundingClientRect().width ?? containerWidth;
    const settingsWidth = settingsRef()?.offsetWidth ?? 0;
    const availableWidth = Math.max(0, rowWidth - settingsWidth - gap);

    if (availableWidth === 0) {
      return;
    }

    const maxButtonWidth = availableWidth;

    measurement.innerHTML = "";
    measurement.style.visibility = "hidden";
    measurement.style.position = "absolute";
    measurement.style.display = "flex";
    measurement.style.gap = `${gap}px`;
    measurement.style.whiteSpace = "nowrap";

    if (domains().length === 0) {
      setMaxVisible(0);
      measurement.innerHTML = "";
      return;
    }

    const buttonWidths = domains().map((domain) => {
      const button = document.createElement("button");
      button.className = "btn btn-ghost btn-xs";
      button.textContent = domain.name;
      button.style.visibility = "hidden";
      button.style.maxWidth = `${maxButtonWidth}px`;
      button.style.whiteSpace = "normal";
      button.style.wordBreak = "break-word";
      measurement.appendChild(button);
      return button.offsetWidth;
    });

    const measureOverflowWidth = (count: number) => {
      const button = document.createElement("button");
      button.className = "btn btn-outline btn-xs";
      button.textContent = `+${count}`;
      button.style.visibility = "hidden";
      measurement.appendChild(button);
      return button.offsetWidth;
    };

    const calculateWithReservedWidth = (reservedWidth: number) => {
      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < buttonWidths.length; i++) {
        const buttonWidth = buttonWidths[i];
        const gapWidth = count > 0 ? gap : 0;
        const newTotalWidth = totalWidth + buttonWidth + gapWidth;

        if (newTotalWidth + reservedWidth <= availableWidth) {
          totalWidth = newTotalWidth;
          count += 1;
        } else {
          break;
        }
      }

      return count;
    };

    let maxCount = calculateWithReservedWidth(0);

    if (maxCount < buttonWidths.length) {
      let overflowCount = Math.max(1, domains().length - maxCount);

      for (let i = 0; i < 2; i++) {
        const overflowWidth = measureOverflowWidth(overflowCount);
        const reservedWidth = overflowWidth + (maxCount > 0 ? gap : 0);
        const nextCount = calculateWithReservedWidth(reservedWidth);

        if (nextCount === maxCount) {
          break;
        }

        maxCount = nextCount;
        overflowCount = Math.max(1, domains().length - maxCount);
      }
    }

    setMaxVisible(maxCount);
    measurement.innerHTML = "";
  };

  const loadDomains = async () => {
    try {
      const fetchedDomains = await quickDomainsService.getQuickDomainsOrdered();
      setDomains(fetchedDomains);
    } catch (error) {
      Logger.error("Failed to load quick domains:", error);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => calculateMaxVisible());
    }
  };

  const handleDomainClick = (domain: string) => {
    props.onDomainSelect(domain);
  };

  const handleOverflowClick = () => {
    setShowManager(true);
  };

  const handleManagerClose = () => {
    setShowManager(false);
  };

  return (
    <>
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-1 flex-wrap gap-2">
              <div class="text-xs text-base-content/60">
                {t("devtools.domain_editor.loading_domains")}
              </div>
            </div>
            <div ref={setSettingsRef} class="shrink-0">
              <IconButton
                type="button"
                label={t("devtools.domain_editor.manage_domains")}
                variant="ghost"
                size="xs"
                circle={false}
                class="text-base-content/60 hover:text-base-content"
                onClick={handleOverflowClick}
                disabled={resultStore.loading}
                icon={
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                }
              />
            </div>
          </div>
        }
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-hidden" ref={setContainerRef}>
            {domains().length > 0 ? (
              visibleDomains().map((domain) => (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  class="max-w-full shrink-0 truncate text-base-content/70"
                  onClick={() => handleDomainClick(domain.domain)}
                  title={t("devtools.domain_editor.domain_value_title", [domain.domain])}
                  disabled={resultStore.loading}
                >
                  {domain.name}
                </Button>
              ))
            ) : (
              <span class="text-xs text-base-content/60">
                {t("devtools.domain_editor.no_domain")}
              </span>
            )}

            {showOverflowButton() && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                class="text-base-content/70"
                onClick={handleOverflowClick}
                title={t("devtools.domain_editor.show_more", [String(hiddenCount())])}
                disabled={resultStore.loading}
              >
                +{hiddenCount()}
              </Button>
            )}
          </div>
          <div ref={setSettingsRef} class="shrink-0">
            <IconButton
              type="button"
              label={t("devtools.domain_editor.manage_domains")}
              variant="ghost"
              size="xs"
              circle={false}
              class="text-base-content/60 hover:text-base-content"
              onClick={handleOverflowClick}
              disabled={resultStore.loading}
              icon={
                <HugeiconsIcon
                  icon={Settings02Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
            />
          </div>
        </div>
        <div
          ref={setMeasurementRef}
          class="flex flex-wrap gap-2"
          style={{
            visibility: "hidden",
            position: "absolute",
            top: "-9999px",
          }}
        ></div>
      </Show>
      <QuickDomainManager
        open={showManager()}
        onClose={handleManagerClose}
        onDomainSelect={handleDomainClick}
      />
    </>
  );
};

interface QuickDomainFormModalProps {
  domain: QuickDomain | null;
  onSave: (data: { name: string; domain: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const QuickDomainFormModal = (props: QuickDomainFormModalProps) => {
  const [name, setName] = createSignal(props.domain?.name || "");
  const [domainValue, setDomainValue] = createSignal(props.domain?.domain || "");
  const validation = createMemo(() => validateDomain(domainValue()));

  const isValid = createMemo(() => validation().isValid);
  const canSave = createMemo(() => name().trim() && domainValue().trim() && isValid());

  createEffect(() => {
    if (props.isOpen) {
      setName(props.domain?.name || "");
      setDomainValue(props.domain?.domain || "");
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (canSave()) {
      props.onSave({
        name: name().trim(),
        domain: domainValue().trim(),
      });
    }
  };

  return (
    <Modal
      open={props.isOpen}
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
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            placeholder={t("devtools.domain_editor.name_placeholder")}
            class="input-bordered input-sm"
            fullWidth
            required
          />
        </FormField>

        <FormField label={t("devtools.sidebar.domain")} required class="gap-2">
          <Textarea
            value={domainValue()}
            onInput={(e) => setDomainValue((e.target as HTMLTextAreaElement).value)}
            placeholder={t("devtools.domain_editor.domain_placeholder")}
            class="textarea-bordered font-mono textarea-sm"
            rows={3}
            fullWidth
            color={!isValid() && domainValue() ? "error" : undefined}
            required
          />
          {!isValid() && domainValue() && (
            <div class="text-xs text-error">{validation().error}</div>
          )}
        </FormField>
      </form>
    </Modal>
  );
};

interface QuickDomainManagerProps {
  open: boolean;
  onClose: () => void;
  onDomainSelect: (domain: string) => void;
}

export const QuickDomainManager = (props: QuickDomainManagerProps) => {
  const [domains, setDomains] = createSignal<QuickDomain[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showForm, setShowForm] = createSignal(false);
  const [editingDomain, setEditingDomain] = createSignal<QuickDomain | null>(null);

  onMount(() => {
    const loadData = async () => {
      try {
        const fetchedDomains = await quickDomainsService.getQuickDomainsOrdered();
        setDomains(fetchedDomains);
      } catch (error) {
        Logger.error("Failed to load domains:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  });

  const handleDelete = (domainId: string) => {
    setDomains(domains().filter((d) => d.id !== domainId));
    quickDomainsService.deleteQuickDomain(domainId).catch(Logger.error);
  };

  const handleAdd = () => {
    setEditingDomain(null);
    setShowForm(true);
  };

  const handleEdit = (domain: QuickDomain) => {
    setEditingDomain(domain);
    setShowForm(true);
  };

  const handleSave = async (domainData: { name: string; domain: string }) => {
    const editing = editingDomain();
    if (editing) {
      const updatedDomain = {
        ...editing,
        ...domainData,
      };
      setDomains(domains().map((d) => (d.id === editing.id ? updatedDomain : d)));
      await quickDomainsService.updateQuickDomain(updatedDomain.id, updatedDomain);
    } else {
      const newDomain: QuickDomain = {
        id: `domain-${Date.now()}`,
        sequence: domains().length,
        ...domainData,
      };
      setDomains([...domains(), newDomain]);
      await quickDomainsService.addQuickDomain(newDomain);
    }
    setShowForm(false);
    setEditingDomain(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDomain(null);
  };

  const handleDomainClick = (domain: string) => {
    props.onDomainSelect(domain);
    props.onClose();
  };

  const handleReorder = async (
    fromIndex: number,
    toIndex: number,
    position: "before" | "after",
  ) => {
    const reordered = reorderArray(domains(), fromIndex, toIndex, position);
    setDomains(reordered);
    await quickDomainsService.reorderQuickDomains(reordered);
  };

  const sortable = createSortableList({
    type: "quickDomain",
    onReorder: handleReorder,
  });

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
          when={!loading()}
          fallback={
            <div class="flex h-[40vh] items-center justify-center text-sm text-base-content/60">
              {t("devtools.domain_editor.loading_domains")}
            </div>
          }
        >
          <div class="flex h-[70vh] flex-col">
            <div class="flex items-center justify-between">
              <Button
                onClick={handleAdd}
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
                ref={(el) => {
                  onMount(() => {
                    const cleanup = attachAutoScroll(el);
                    onCleanup(cleanup);
                  });
                }}
              >
                <For each={domains()}>
                  {(domain, index) => {
                    let rowEl!: HTMLDivElement;
                    let handleEl!: HTMLDivElement;
                    const item = sortable.useItem(index);
                    onMount(() => {
                      const cleanup = item.attach(rowEl, handleEl);
                      onCleanup(cleanup);
                    });
                    return (
                      <div
                        ref={rowEl}
                        class="relative"
                        classList={{
                          "opacity-40": item.isDragging(),
                        }}
                      >
                        <div class="flex items-center gap-1">
                          <div
                            ref={handleEl}
                            class="cursor-grab text-base-content/40 hover:text-base-content active:cursor-grabbing"
                          >
                            <HugeiconsIcon
                              icon={DragDropVerticalIcon}
                              size={16}
                              color="currentColor"
                            />
                          </div>
                          <div class="flex-1">
                            <QuickDomainRow
                              domain={domain}
                              onDomainClick={handleDomainClick}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        </div>
                        <Show
                          when={
                            sortable.dropTarget()?.index === index() &&
                            sortable.dropTarget()?.edge === "top"
                          }
                        >
                          <div
                            class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary"
                            style={{ top: "-5px" }}
                          />
                        </Show>
                        <Show
                          when={
                            sortable.dropTarget()?.index === index() &&
                            sortable.dropTarget()?.edge === "bottom"
                          }
                        >
                          <div
                            class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary"
                            style={{
                              top: "calc(100% + 3px)",
                            }}
                          />
                        </Show>
                      </div>
                    );
                  }}
                </For>

                <Show when={domains().length === 0}>
                  <div class="py-10 text-center text-sm text-base-content/60">
                    <p class="mb-2 font-medium text-base-content">
                      {t("devtools.domain_editor.no_domains")}
                    </p>
                    <p>{t("devtools.domain_editor.no_domains_hint")}</p>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Modal>
      <QuickDomainFormModal
        domain={editingDomain()}
        onSave={handleSave}
        onCancel={handleCancel}
        isOpen={showForm()}
      />
    </>
  );
};

interface QuickDomainRowProps {
  domain: QuickDomain;
  onDomainClick: (domain: string) => void;
  onEdit: (domain: QuickDomain) => void;
  onDelete: (domainId: string) => void;
}

export const QuickDomainRow = (props: QuickDomainRowProps) => {
  return (
    <div class="py-0.5">
      <div class="flex items-center gap-3 rounded-md border border-base-300 bg-base-200 p-3">
        <div class="domain-content min-w-0 flex-1">
          <div class="domain-name truncate text-sm font-semibold text-base-content">
            {props.domain.name}
          </div>
          <div
            title={props.domain.domain}
            class="domain-value truncate text-xs/relaxed break-all text-base-content/70"
          >
            {props.domain.domain}
          </div>
        </div>

        <div class="domain-actions flex shrink-0 items-center gap-2">
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
};
