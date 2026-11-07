import { Calendar02Icon, ListViewIcon, PivotIcon, TableIcon } from "@hugeicons/core-free-icons";
import { createMemo, Match, Switch, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";
import type { IconData } from "@/components/ui/hugeicons-icon";
import { CalendarView } from "@/screens/devtools/components/calendar-view";
import { useRecordContextMenu } from "@/screens/devtools/components/record-context-menu";
import { RecordRenderer } from "@/screens/devtools/components/record-renderer";
import { sortedFieldNames } from "@/screens/devtools/components/record-utils";
import { VirtualTable } from "@/screens/devtools/components/virtual-table";
import type { FieldMetadata } from "@/types";

export type ViewMode = "list" | "table" | "pivot" | "calendar";

export const VIEW_MODES: { value: ViewMode; label: string; icon: IconData }[] = [
  { value: "list", label: "devtools.result_viewer.list_view", icon: ListViewIcon },
  { value: "table", label: "devtools.result_viewer.table_view", icon: TableIcon },
  { value: "pivot", label: "devtools.result_viewer.pivot_view", icon: PivotIcon },
  { value: "calendar", label: "devtools.result_viewer.calendar_view", icon: Calendar02Icon },
];

interface RecordsViewProps {
  records: Record<string, unknown>[];
  fieldsMetadata?: Record<string, FieldMetadata>;
  model?: string;
  mode: ViewMode;
  level?: number;
  /** Fields picked in the query (all fields when empty). */
  selectedFields?: string[];
  resetKey?: unknown;
  /** Inside a relational field: bounded height, and a single record shown open. */
  nested?: boolean;
  /** Shown above the list (record search). */
  listHeader?: JSX.Element;
  listRef?: (element: HTMLDivElement) => void;
}

/** Records shown as a list, a table, a pivot table or a calendar. */
export const RecordsView = (props: RecordsViewProps) => {
  const contextMenu = useRecordContextMenu();
  const fieldNames = createMemo(() => sortedFieldNames(props.records));
  const nested = () => !!props.nested;
  const boundedClass =
    "flex max-h-80 min-h-0 flex-col overflow-hidden rounded-box border border-line-soft";

  return (
    <Switch>
      <Match when={props.mode === "calendar"}>
        <div class={nested() ? boundedClass : "flex min-h-0 flex-1 flex-col overflow-hidden"}>
          <CalendarView
            data={props.records}
            fieldsMetadata={props.fieldsMetadata}
            model={props.model}
            selectedFields={props.selectedFields ?? []}
          />
        </div>
      </Match>
      <Match when={props.mode === "table" || props.mode === "pivot"}>
        <div class={nested() ? boundedClass : "flex min-h-0 flex-1 flex-col overflow-hidden"}>
          <VirtualTable
            data={props.records}
            allKeys={fieldNames()}
            fieldsMetadata={props.fieldsMetadata}
            selectedFields={props.selectedFields}
            handleTableContextMenu={contextMenu.tableHandler(
              () => props.records,
              () => props.fieldsMetadata,
              () => props.model,
            )}
            pivoted={props.mode === "pivot"}
          />
        </div>
      </Match>
      <Match when={props.mode === "list"}>
        <div
          ref={props.listRef}
          class={cx(
            "flex flex-col",
            nested() ? undefined : "relative min-h-0 flex-1 overflow-auto",
          )}
        >
          {props.listHeader}
          <RecordRenderer
            records={props.records}
            fieldsMetadata={props.fieldsMetadata}
            model={props.model}
            level={props.level}
            resetKey={props.resetKey}
            asList={!nested() || props.records.length > 1}
            showId
          />
        </div>
      </Match>
    </Switch>
  );
};
