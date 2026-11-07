import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { matchesQuery } from "@/components/ui/command-registry";
import {
  NoSearchResults,
  PageHeader,
  SectionHeader,
} from "@/screens/options/components/page-header";
import {
  SCROLL_CONTAINER_ID,
  scrollToSection,
  searchQuery,
  setActiveSection,
} from "@/screens/options/options-nav";
import {
  isSettingsSection,
  SETTINGS_SECTIONS,
  type SettingsSection,
  type SettingsSectionDef,
} from "@/screens/options/sections";
import { localeVersion, t } from "@/services/i18n-service";

const Section = (props: { section: SettingsSectionDef }) => (
  <section data-search-section class="mt-8 first:mt-0 sm:mt-12">
    <SectionHeader
      id={props.section.id}
      icon={props.section.icon}
      tone={props.section.tone}
      title={t(props.section.label)}
      description={t(props.section.description)}
    />
    <div class="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2 xl:gap-4">
      <For each={props.section.columns ?? []}>
        {(column) => (
          <div class="flex min-w-0 flex-col gap-2.5 xl:gap-4">
            <For each={column}>{(card) => <Dynamic component={card.Component} />}</For>
          </div>
        )}
      </For>
      <For each={props.section.wide ?? []}>{(card) => <Dynamic component={card.Component} />}</For>
    </div>
  </section>
);

/** Hides the cards (and grouped toggles) that do not match the search query. */
const filterSettings = (root: HTMLElement, query: string) => {
  let anyVisible = false;
  for (const section of root.querySelectorAll<HTMLElement>("[data-search-section]")) {
    let sectionVisible = false;
    for (const card of section.querySelectorAll<HTMLElement>("[data-search-card]")) {
      const keywords = card.dataset.searchKeywords ?? "";
      const items = card.querySelectorAll<HTMLElement>("[data-search-item]");
      let cardVisible: boolean;
      if (items.length) {
        const header = card.querySelector("header")?.textContent ?? "";
        const headerMatch = matchesQuery(`${header} ${keywords}`, query);
        cardVisible = false;
        let position = 0;
        for (const item of items) {
          const visible = headerMatch || matchesQuery(item.textContent ?? "", query);
          item.hidden = !visible;
          cardVisible ||= visible;
          if (!visible) continue;
          // Grid position among visible items, used for the dividers.
          item.dataset.first = String(position === 0);
          item.dataset.col = String(position % 2);
          item.dataset.row = position < 2 ? "first" : "next";
          position++;
        }
      } else {
        cardVisible = matchesQuery(`${card.textContent ?? ""} ${keywords}`, query);
      }
      card.hidden = !cardVisible;
      sectionVisible ||= cardVisible;
    }
    section.hidden = !sectionVisible;
    anyVisible ||= sectionVisible;
  }
  return anyVisible;
};

export const OptionsPage = () => {
  let rootRef: HTMLDivElement | undefined;
  const [hasResults, setHasResults] = createSignal(true);

  createEffect(() => {
    localeVersion();
    const query = searchQuery();
    if (rootRef) setHasResults(filterSettings(rootRef, query));
  });

  onMount(() => {
    const container = document.getElementById(SCROLL_CONTAINER_ID);

    const scrollToHash = () => {
      const hash = window.location.hash.split("#").pop()?.replace(/^\//, "") ?? "";
      if (isSettingsSection(hash)) scrollToSection(hash);
    };

    const updateActiveSection = () => {
      if (!container) return;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 4;
      const containerTop = container.getBoundingClientRect().top;
      let current: SettingsSection = SETTINGS_SECTIONS[0].id;
      for (const { id } of SETTINGS_SECTIONS) {
        const element = document.getElementById(id);
        if (!element || element.closest("[hidden]")) continue;
        if (atBottom || element.getBoundingClientRect().top - containerTop <= 140) current = id;
      }
      setActiveSection(current);
    };

    scrollToHash();
    updateActiveSection();
    window.addEventListener("hashchange", scrollToHash);
    container?.addEventListener("scroll", updateActiveSection, { passive: true });
    onCleanup(() => {
      window.removeEventListener("hashchange", scrollToHash);
      container?.removeEventListener("scroll", updateActiveSection);
    });
  });

  return (
    <div>
      <PageHeader
        eyebrow={t("options.page.settings_eyebrow")}
        title={t("options.page.settings_title")}
        description={t("options.page.settings_desc")}
      />
      <div ref={(el) => (rootRef = el)}>
        <For each={SETTINGS_SECTIONS}>{(section) => <Section section={section} />}</For>
        <Show when={!hasResults()}>
          <NoSearchResults
            class="mt-6"
            title={t("options.search.no_settings_title")}
            description={t("options.search.no_settings_desc", [searchQuery().trim()])}
          />
        </Show>
      </div>
    </div>
  );
};
