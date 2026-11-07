import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { createResource, createSignal, For, Index, onCleanup, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/utils/i18n-page";

import { loadAccessSections, type AccessRow, type AccessSection } from "./access-sources";
import { AsyncModal } from "./async-modal";
import {
  CRUD_COLUMNS,
  CopyValue,
  CrudBadges,
  Flag,
  SectionTitle,
  permissionTitle,
} from "./detail-parts";

const MIN_COLUMN_WIDTH = 40;

const useColumnResize = (defaults: number[]) => {
  const [widths, setWidths] = createSignal([...defaults]);
  let stopResize: (() => void) | undefined;

  const startResize = (index: number, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = widths()[index];

    const onMove = (move: MouseEvent) => {
      const width = Math.max(MIN_COLUMN_WIDTH, startWidth + move.clientX - startX);
      setWidths((previous) => previous.map((w, i) => (i === index ? width : w)));
    };
    stopResize = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", stopResize!);
      document.body.style.userSelect = "";
      stopResize = undefined;
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", stopResize);
  };

  onCleanup(() => stopResize?.());
  return { widths, startResize };
};

const ResizeHandle = (props: { onResize: (event: MouseEvent) => void }) => (
  <div
    class="absolute inset-y-0 inset-e-0 w-1 cursor-col-resize hover:bg-base-300"
    onMouseDown={props.onResize}
  />
);

const AccessTable = (props: { rows: AccessRow[] }) => {
  const columns = useColumnResize([180, 50, 50, 50, 50]);
  return (
    <div class="overflow-x-auto rounded-lg border border-base-300">
      <table class="table table-xs" style={{ "table-layout": "fixed" }}>
        <colgroup>
          <Index each={columns.widths()}>
            {(width) => <col style={{ width: `${width()}px` }} />}
          </Index>
        </colgroup>
        <thead>
          <tr>
            <th class="relative">
              {t("technical_list.model_actions.group")}
              <ResizeHandle onResize={(event) => columns.startResize(0, event)} />
            </th>
            <For each={CRUD_COLUMNS}>
              {(column, index) => (
                <th class="relative text-center">
                  {column.label()}
                  <ResizeHandle onResize={(event) => columns.startResize(index() + 1, event)} />
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row) => (
              <tr>
                <td class="truncate" title={row.name}>
                  {row.name}
                </td>
                <For each={CRUD_COLUMNS}>
                  {(column) => (
                    <td class="text-center">
                      <Flag
                        value={row.permissions[column.key]}
                        title={permissionTitle(column.label(), row.permissions[column.key])}
                      />
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
};

const AccessCard = (props: { row: AccessRow }) => (
  <div class="rounded-lg border border-base-300 p-3">
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-medium">{props.row.name}</span>
      <CrudBadges permissions={props.row.permissions} />
    </div>
    <div class="mt-2 space-y-1 text-xs">
      <Show when={props.row.groups}>
        {(groups) => (
          <div>
            <span class="opacity-60">{groups().label}:</span> {groups().value}
          </div>
        )}
      </Show>
      <div>
        <span class="opacity-60">{t("technical_list.model_actions.domain")}:</span>{" "}
        <Show
          when={props.row.domain}
          fallback={
            <code class="rounded-sm bg-base-200/60 px-1">
              {t("technical_list.model_actions.no_domain")}
            </code>
          }
        >
          {(domain) => <CopyValue value={domain()} />}
        </Show>
      </div>
    </div>
  </div>
);

const AccessSectionView = (props: { section: AccessSection; canOpenDetails: boolean }) => (
  <section>
    <SectionTitle
      icon={props.section.icon}
      title={props.section.title}
      aside={
        <Show when={props.canOpenDetails && props.section.rows.length > 0}>
          <Button
            variant="ghost"
            size="xs"
            class="gap-1 text-xs"
            onClick={() => props.section.openDetails()}
          >
            {t("technical_list.model_actions.more_details")}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} strokeWidth={1.8} />
          </Button>
        </Show>
      }
    />
    <Show when={props.section.description}>
      <p class="mb-2 text-xs opacity-50">{props.section.description}</p>
    </Show>
    <Show
      when={props.section.rows.length > 0}
      fallback={<p class="text-xs opacity-60">{props.section.emptyLabel}</p>}
    >
      <Show
        when={props.section.layout === "table"}
        fallback={
          <div class="space-y-2">
            <For each={props.section.rows}>{(row) => <AccessCard row={row} />}</For>
          </div>
        }
      >
        <AccessTable rows={props.section.rows} />
      </Show>
    </Show>
  </section>
);

export const AccessModal = (props: {
  open: boolean;
  onClose: () => void;
  model: string;
  /** The web client can open the access records. */
  canOpenDetails: boolean;
}) => {
  const [sections] = createResource(
    () => props.open && { model: props.model },
    ({ model }) => loadAccessSections(model),
  );

  return (
    <AsyncModal
      open={props.open}
      onClose={props.onClose}
      title={t("technical_list.model_actions.access_modal_title", [props.model])}
      size="xl"
      boxClass="max-w-[900px]"
      loadingLabel={t("technical_list.model_actions.loading_access")}
      data={sections}
    >
      {(loaded) => (
        <div class="space-y-6">
          <For each={loaded}>
            {(section) => (
              <AccessSectionView section={section} canOpenDetails={props.canOpenDetails} />
            )}
          </For>
        </div>
      )}
    </AsyncModal>
  );
};
