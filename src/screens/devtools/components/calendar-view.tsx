import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  Layers02Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useRecordActions } from "@/screens/devtools/components/record-hooks";
import { RecordRenderer } from "@/screens/devtools/components/record-renderer";
import { queryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types/devtools.types";

interface CalendarViewProps {
  data: Record<string, unknown>[];
  fieldsMetadata?: Record<string, FieldMetadata>;
  model?: string;
}

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const RECORDS_PER_DAY_MONTH_VIEW = 3;
const RECORDS_PER_DAY_WEEK_VIEW = 12;

function parseOdooDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const dateStr = value.split(" ")[0];
  const parsed = new Date(dateStr + "T00:00:00");
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function getRecordName(record: Record<string, unknown>, index: number): string {
  return (
    (record.name as string) ||
    (record.display_name as string) ||
    t("devtools.field_rendering.record_n", [String(index + 1)])
  );
}

type CalendarViewMode = "month" | "week" | "day";

const [selectedField, setSelectedField] = createSignal<string>("");
const [viewMode, setViewMode] = createSignal<CalendarViewMode>("month");

export const CalendarView = (props: CalendarViewProps) => {
  const { openRecords } = useRecordActions();

  const dateFields = createMemo(() => {
    const meta = props.fieldsMetadata;
    if (!meta) return [];
    const selected = queryStore.selectedFields;
    const entries = Object.entries(meta).filter(
      ([, m]) => m.type === "date" || m.type === "datetime",
    );
    const filtered =
      selected.length > 0 ? entries.filter(([name]) => selected.includes(name)) : entries;
    return filtered.map(([name, m]) => ({ name, label: m.string || name, type: m.type }));
  });

  const [currentDate, setCurrentDate] = createSignal(new Date());

  createEffect(() => {
    const fields = dateFields();
    if (fields.length === 0) return;
    const current = selectedField();
    if (!current || !fields.some((f) => f.name === current)) {
      setSelectedField(fields[0].name);
    }
  });

  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const periodLabel = createMemo(() => {
    const d = currentDate();
    const mode = viewMode();
    if (mode === "month") {
      return `${t(`devtools.calendar.${MONTH_NAMES[d.getMonth()]}`)} ${d.getFullYear()}`;
    }
    if (mode === "week") {
      const monday = getMonday(d);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sameMonth = monday.getMonth() === sunday.getMonth();
      const mondayStr = `${monday.getDate()} ${t(`devtools.calendar.${MONTH_NAMES[monday.getMonth()]}`)}`;
      const sundayStr = sameMonth
        ? `${sunday.getDate()}`
        : `${sunday.getDate()} ${t(`devtools.calendar.${MONTH_NAMES[sunday.getMonth()]}`)}`;
      return `${mondayStr} - ${sundayStr}, ${sunday.getFullYear()}`;
    }
    return `${t(`devtools.calendar.${WEEKDAYS[getWeekdayIndex(d)]}`)} ${d.getDate()} ${t(`devtools.calendar.${MONTH_NAMES[d.getMonth()]}`)} ${d.getFullYear()}`;
  });

  const getWeekdayIndex = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getRecordsForDate = (date: Date) => {
    const field = selectedField();
    const data = props.data;
    const records: Array<{ record: Record<string, unknown>; index: number }> = [];
    if (!field) return records;
    data.forEach((record, index) => {
      const raw = record[field];
      const parsed = parseOdooDate(raw);
      if (parsed && parsed.getTime() === date.getTime()) {
        records.push({ record, index });
      }
    });
    return records;
  };

  const gridDays = createMemo(() => {
    const mode = viewMode();
    const d = currentDate();

    if (mode === "day") {
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return [{ date, records: getRecordsForDate(date) }];
    }

    if (mode === "week") {
      const monday = getMonday(d);
      const days: Array<{
        date: Date;
        records: Array<{ record: Record<string, unknown>; index: number }>;
      }> = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({ date, records: getRecordsForDate(date) });
      }
      return days;
    }

    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const days: Array<{
      date: Date | null;
      records: Array<{ record: Record<string, unknown>; index: number }>;
    }> = [];

    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, records: [] });
    }

    for (let dd = 1; dd <= lastDay.getDate(); dd++) {
      const date = new Date(year, month, dd);
      days.push({ date, records: getRecordsForDate(date) });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    while (days.length < totalCells) {
      days.push({ date: null, records: [] });
    }

    return days;
  });

  const prev = () => {
    const d = currentDate();
    const mode = viewMode();
    if (mode === "month") {
      setCurrentDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (mode === "week") {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const next = () => {
    const d = currentDate();
    const mode = viewMode();
    if (mode === "month") {
      setCurrentDate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (mode === "week") {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const [selectedRecords, setSelectedRecords] = createSignal<Record<string, unknown>[] | null>(
    null,
  );
  const [modalExpandedRows, setModalExpandedRows] = createSignal<Set<number>>(new Set());

  const handleOpenRecord = (record: Record<string, unknown>) => {
    setSelectedRecords([record]);
    setModalExpandedRows(new Set([0]));
  };

  const handleOpenRecords = (
    records: Array<{ record: Record<string, unknown>; index: number }>,
  ) => {
    if (records.length === 0) return;
    setSelectedRecords(records.map((r) => r.record));
    setModalExpandedRows(new Set<number>());
  };

  const toggleModalRow = (index: number) => {
    const current = new Set<number>(modalExpandedRows());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    setModalExpandedRows(current);
  };

  const handleOpenInOdoo = (event: Event, asPopup = false) => {
    const records = selectedRecords();
    if (!records || !props.model) return;
    const ids = records.map((r) => r.id as number).filter((id) => id != null);
    if (ids.length === 0) return;
    openRecords(ids, props.model, event, asPopup);
    setSelectedRecords(null);
  };

  createEffect(() => {
    if (!selectedRecords()) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedRecords(null);
    };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  return (
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex flex-wrap items-center gap-2 border-b border-base-200 px-3 py-2">
        <Show when={dateFields().length > 0}>
          <span
            class="cursor-help text-xs font-medium text-base-content/60"
            title={t("devtools.calendar.date_field_tooltip")}
          >
            {t("devtools.calendar.date_field")}
          </span>
          <Show when={dateFields().length > 1}>
            <select
              class="select-bordered select w-auto max-w-[200px] rounded-sm select-xs"
              value={selectedField()}
              onChange={(e) => setSelectedField(e.currentTarget.value)}
            >
              <For each={dateFields()}>
                {(field) => <option value={field.name}>{field.label}</option>}
              </For>
            </select>
          </Show>
          <Show when={dateFields().length === 1}>
            <span class="text-xs text-base-content/80">{dateFields()[0].label}</span>
          </Show>
        </Show>
        <div class="ml-auto flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={prev} title={t("devtools.calendar.previous")}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
          </Button>
          <span class="min-w-[140px] text-center text-sm font-medium">{periodLabel()}</span>
          <Button size="xs" variant="ghost" onClick={next} title={t("devtools.calendar.next")}>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.5}
            />
          </Button>
          <Button size="xs" variant="ghost" onClick={goToday} title={t("devtools.calendar.today")}>
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
              <div class="px-1 py-1.5 text-center text-xs font-medium text-base-content/70">
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
          {(day) => (
            <div
              class="border-r border-b border-base-200 p-1"
              classList={{
                "bg-base-100 hover:bg-base-300/50": day.date !== null,
                "bg-base-200/30": !day.date,
                "cursor-pointer": day.records.length > 0,
                "min-h-[60px]": viewMode() !== "day",
                "flex flex-col": viewMode() === "day",
              }}
              onClick={() => day.records.length > 0 && handleOpenRecords(day.records)}
            >
              <Show when={day.date}>
                <div
                  class={`mb-1 text-xs ${
                    viewMode() === "day" ? "font-bold text-accent" : "text-right"
                  } ${isToday(day.date) && viewMode() !== "day" ? "font-bold text-accent" : "text-base-content/70"}`}
                >
                  {viewMode() === "day"
                    ? `${t(`devtools.calendar.${WEEKDAYS[getWeekdayIndex(day.date!)]}`)} ${day.date!.getDate()} ${t(`devtools.calendar.${MONTH_NAMES[day.date!.getMonth()]}`)} ${day.date!.getFullYear()}`
                    : day.date!.getDate()}
                </div>
                <div class={`flex flex-col gap-0.5 ${viewMode() === "day" ? "gap-1" : ""}`}>
                  <For
                    each={
                      viewMode() === "day"
                        ? day.records
                        : day.records.slice(
                            0,
                            viewMode() === "week"
                              ? RECORDS_PER_DAY_WEEK_VIEW
                              : RECORDS_PER_DAY_MONTH_VIEW,
                          )
                    }
                  >
                    {(item) => (
                      <Button
                        size="xs"
                        color="primary"
                        variant="solid"
                        class="justify-start truncate rounded-sm"
                        title={getRecordName(item.record, item.index)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRecord(item.record);
                        }}
                      >
                        {getRecordName(item.record, item.index)}
                      </Button>
                    )}
                  </For>
                  <Show
                    when={
                      viewMode() !== "day" &&
                      day.records.length >
                        (viewMode() === "week"
                          ? RECORDS_PER_DAY_WEEK_VIEW
                          : RECORDS_PER_DAY_MONTH_VIEW)
                    }
                  >
                    <span class="text-[10px] text-base-content/70">
                      +
                      {day.records.length -
                        (viewMode() === "week"
                          ? RECORDS_PER_DAY_WEEK_VIEW
                          : RECORDS_PER_DAY_MONTH_VIEW)}{" "}
                      {t("devtools.calendar.more")}
                    </span>
                  </Show>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <Show when={selectedRecords()}>
        <div
          class="fixed inset-0 z-9998 flex items-center justify-center p-4"
          style={{ "background-color": "oklch(0% 0 0 / 0.4)" }}
          onClick={() => setSelectedRecords(null)}
        >
          <div
            class="flex max-h-[85vh] w-full max-w-full flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between border-b border-base-200 px-4 py-3">
              <h3 class="text-lg font-bold">{t("devtools.calendar.record_details")}</h3>
              <IconButton
                label="Close"
                variant="ghost"
                size="sm"
                circle
                onClick={() => setSelectedRecords(null)}
                icon={
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={2}
                  />
                }
              />
            </div>
            <div class="max-h-[60vh] overflow-auto">
              <RecordRenderer
                records={selectedRecords()!}
                fieldsMetadata={props.fieldsMetadata}
                showId={true}
                clickableRow={true}
                renderAsList={selectedRecords()!.length > 1}
                onExpandToggle={toggleModalRow}
                expandedRecords={modalExpandedRows}
              />
            </div>
            <Show when={props.model}>
              <div class="flex justify-end gap-2 border-t border-base-200 px-4 py-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleOpenInOdoo(e as unknown as Event, false)}
                >
                  <span class="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                    {t("devtools.result_viewer.open_in_odoo")}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleOpenInOdoo(e as unknown as Event, true)}
                >
                  <span class="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Layers02Icon}
                      size={14}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                    {t("devtools.result_viewer.open_in_popup")}
                  </span>
                </Button>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};
