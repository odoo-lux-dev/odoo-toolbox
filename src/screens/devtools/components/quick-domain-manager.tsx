import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, onCleanup, onMount, Show, type Accessor } from "solid-js";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import type { QuickDomainsStore } from "@/screens/devtools/components/quick-domains";
import { t } from "@/services/i18n-service";
import type { QuickDomain } from "@/types";
import { attachAutoScroll, createSortableList, reorderArray } from "@/utils/drag-drop";
import { domainError } from "@/utils/query-validation";

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

export const QuickDomainManager = (props: {
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
