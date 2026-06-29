import { onMount, onCleanup, For } from "solid-js";

import { t } from "@/services/i18n-service";

import { ExtensionOptions } from "../options-list";

export const OptionsPage = () => {
  onMount(() => {
    const scrollToHash = () => {
      const rawHash = window.location.hash;
      const hash = rawHash.split("#").pop()?.replace(/^\//, "") ?? "";
      if (!hash) return;
      if (hash === "odoo-options") {
        const container = document.getElementById("content-container");
        container?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const element = document.getElementById(hash);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    onCleanup(() => window.removeEventListener("hashchange", scrollToHash));
  });

  return (
    <div class="flex flex-col gap-8">
      <section class="flex flex-col gap-4">
        <div class="divider">
          <h2 id="odoo-options" class="text-xl font-semibold">
            {t("options.sidebar.odoo")}
          </h2>
        </div>
        <div class="columns-1 gap-4 md:columns-2">
          <For each={ExtensionOptions.filter((option) => option.category === "Odoo")}>
            {(option) => <div class="mb-4 break-inside-avoid">{option.component()}</div>}
          </For>
        </div>
      </section>
      <section class="flex flex-col gap-4">
        <div class="divider">
          <h2 id="odoosh-options" class="text-xl font-semibold">
            {t("options.sidebar.odoo_sh")}
          </h2>
        </div>
        <div class="columns-1 gap-4 md:columns-2">
          <For each={ExtensionOptions.filter((option) => option.category === "Odoo.SH")}>
            {(option) => <div class="mb-4 break-inside-avoid">{option.component()}</div>}
          </For>
        </div>
      </section>
    </div>
  );
};
