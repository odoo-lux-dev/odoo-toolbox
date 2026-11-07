import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Layers02Icon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import {
  dateFields,
  isSameDay,
  MONTH_NAMES,
  parseOdooDate,
  periodDays,
  RECORDS_PER_DAY,
  shiftPeriod,
  startOfWeek,
  addDays,
  weekdayIndex,
  WEEKDAYS,
  type CalendarViewMode,
} from "@/screens/devtools/components/calendar-utils";
import { openRecords } from "@/screens/devtools/components/record-actions";
import { RecordRenderer } from "@/screens/devtools/components/record-renderer";
import { recordDisplayName } from "@/screens/devtools/components/record-utils";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";

type RecordData = Record<string, unknown>;

interface CalendarViewProps {
  data: RecordData[];
  fieldsMetadata?: Record<string, FieldMetadata>;
  model?: string;
  /** Selected fields of the query: only those date fields are offered when set. */
  selectedFields: string[];
}

const monthName = (date: Date) => t(`devtools.calendar.${MONTH_NAMES[date.getMonth()]}`);
const weekdayName = (date: Date) => t(`devtools.calendar.${WEEKDAYS[weekdayIndex(date)]}`);
const fullDate = (date: Date) =>
  `${weekdayName(date)} ${date.getDate()} ${monthName(date)} ${date.getFullYear()}`;

export const CalendarView = (props: CalendarViewProps) => {
  const [viewMode, setViewMode] = createSignal<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [chosenField, setChosenField] = createSignal<string>();
  const [selectedRecords, setSelectedRecords] = createSignal<RecordData[] | null>(null);

  const fields = createMemo(() => dateFields(props.fieldsMetadata, props.selectedFields));
  /** The chosen date field while it is still offered, else the first one. */
  const dateField = () =>
    fields().find((field) => field.name === chosenField())?.name ?? fields()[0]?.name;

  const periodLabel = () => {
    const date = currentDate();
    if (viewMode() === "month") return `${monthName(date)} ${date.getFullYear()}`;
    if (viewMode() === "day") return fullDate(date);
    const monday = startOfWeek(date);
    const sunday = addDays(monday, 6);
    const start = `${monday.getDate()} ${monthName(monday)}`;
    const end =
      monday.getMonth() === sunday.getMonth()
        ? `${sunday.getDate()}`
        : `${sunday.getDate()} ${monthName(sunday)}`;
    return `${start} - ${end}, ${sunday.getFullYear()}`;
  };

  const gridDays = createMemo(() => {
    const field = dateField();
    const recordsByDay = new Map<number, { record: RecordData; index: number }[]>();
    if (field) {
      props.data.forEach((record, index) => {
        const day = parseOdooDate(record[field])?.getTime();
        if (day !== undefined)
          recordsByDay.set(day, [...(recordsByDay.get(day) ?? []), { record, index }]);
      });
    }
    return periodDays(currentDate(), viewMode()).map((date) => ({
      date,
      records: date ? (recordsByDay.get(date.getTime()) ?? []) : [],
    }));
  });

  const openInOdoo = (asPopup: boolean) => {
    const ids = (selectedRecords() ?? [])
      .map((record) => record.id as number)
      .filter((id) => id != null);
    if (props.model) openRecords(props.model, ids, asPopup);
    setSelectedRecords(null);
  };

  return (
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex flex-wrap items-center gap-2 border-b border-base-200 px-3 py-2">
        <Show when={fields().length > 0}>
          <span
            class="cursor-help text-ui font-medium text-base-content/60"
            title={t("devtools.calendar.date_field_tooltip")}
          >
            {t("devtools.calendar.date_field")}
          </span>
          <Show
            when={fields().length > 1}
            fallback={<span class="text-ui text-base-content/80">{fields()[0].label}</span>}
          >
            <select
              class="select-bordered select w-auto max-w-[200px] rounded-sm select-xs"
              value={dateField()}
              onChange={(e) => setChosenField(e.currentTarget.value)}
            >
              <For each={fields()}>
                {(field) => <option value={field.name}>{field.label}</option>}
              </For>
            </select>
          </Show>
        </Show>
        <div class="ms-auto flex items-center gap-1">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setCurrentDate(shiftPeriod(currentDate(), viewMode(), -1))}
            title={t("devtools.calendar.previous")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} />
          </Button>
          <span class="min-w-[140px] text-center text-sm font-medium">{periodLabel()}</span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setCurrentDate(shiftPeriod(currentDate(), viewMode(), 1))}
            title={t("devtools.calendar.next")}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.5} />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setCurrentDate(new Date())}
            title={t("devtools.calendar.today")}
          >
            {t("devtools.calendar.today")}
          </Button>
          <select
            class="select-bordered select w-auto rounded-sm select-xs"
            value={viewMode()}
            onChange={(e) => setViewMode(e.currentTarget.value as CalendarViewMode)}
          >
            <option value="month">{t("devtools.calendar.month")}</option>
            <option value="week">{t("devtools.calendar.week")}</option>
            <option value="day">{t("devtools.calendar.day")}</option>
          </select>
        </div>
      </div>

      <Show when={viewMode() !== "day"}>
        <div class="grid grid-cols-7 border-b border-base-200 bg-base-200">
          <For each={WEEKDAYS}>
            {(day) => (
              <div class="px-1 py-1.5 text-center text-ui font-medium text-base-content/70">
                {t(`devtools.calendar.${day}`)}
              </div>
            )}
          </For>
        </div>
      </Show>

      <div
        class={`grid min-h-0 flex-1 overflow-auto ${viewMode() === "day" ? "grid-cols-1" : "grid-cols-7"}`}
      >
        <For each={gridDays()}>
          {(day) => {
            const limit = () => RECORDS_PER_DAY[viewMode()];
            return (
              <div
                class="border-r border-b border-base-200 p-1"
                classList={{
                  "bg-base-100 hover:bg-base-300/50": day.date !== null,
                  "bg-base-200/30": !day.date,
                  "cursor-pointer": day.records.length > 0,
                  "min-h-[60px]": viewMode() !== "day",
                  "flex flex-col": viewMode() === "day",
                }}
                onClick={() =>
                  day.records.length > 0 && setSelectedRecords(day.records.map((r) => r.record))
                }
              >
                <Show when={day.date}>
                  {(date) => (
                    <>
                      <div
                        class="mb-1 text-ui"
                        classList={{
                          "font-bold text-accent":
                            viewMode() === "day" || isSameDay(date(), new Date()),
                          "text-right": viewMode() !== "day",
                          "text-base-content/70":
                            viewMode() !== "day" && !isSameDay(date(), new Date()),
                        }}
                      >
                        {viewMode() === "day" ? fullDate(date()) : date().getDate()}
                      </div>
                      <div class={`flex flex-col ${viewMode() === "day" ? "gap-1" : "gap-0.5"}`}>
                        <For each={day.records.slice(0, limit())}>
                          {(item) => (
                            <Button
                              size="xs"
                              color="primary"
                              variant="solid"
                              class="justify-start truncate rounded-sm"
                              title={recordDisplayName(item.record, item.index)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecords([item.record]);
                              }}
                            >
                              {recordDisplayName(item.record, item.index)}
                            </Button>
                          )}
                        </For>
                        <Show when={day.records.length > limit()}>
                          <span class="text-small text-base-content/70">
                            +{day.records.length - limit()} {t("devtools.calendar.more")}
                          </span>
                        </Show>
                      </div>
                    </>
                  )}
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <Modal
        open={selectedRecords() !== null}
        onClose={() => setSelectedRecords(null)}
        title={t("devtools.calendar.record_details")}
        size="xl"
        footer={
          <Show when={props.model}>
            <Button size="sm" variant="ghost" class="gap-2" onClick={() => openInOdoo(false)}>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.5} />
              {t("devtools.result_viewer.open_in_odoo")}
            </Button>
            <Button size="sm" variant="ghost" class="gap-2" onClick={() => openInOdoo(true)}>
              <HugeiconsIcon icon={Layers02Icon} size={14} strokeWidth={1.5} />
              {t("devtools.result_viewer.open_in_popup")}
            </Button>
          </Show>
        }
      >
        <Show when={selectedRecords()}>
          {(records) => (
            <div class="max-h-[60vh] overflow-auto">
              <RecordRenderer
                records={records()}
                fieldsMetadata={props.fieldsMetadata}
                model={props.model}
                showId
                asList
              />
            </div>
          )}
        </Show>
      </Modal>
    </div>
  );
};
