import { For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { usePopup } from "@/screens/popup/popup-signals";
import { t } from "@/services/i18n-service";

import { ProjectItem } from "./project-item";

const EmptyState = () => (
  <div class="flex flex-col items-center gap-2 p-4 text-center">
    <p class="text-sm font-medium">{t("common.no_favorites")}</p>
    <p class="text-sm opacity-80">{t("common.no_favorites_hint")}</p>
    <Button
      size="sm"
      color="primary"
      class="w-fit"
      onClick={() => window.open("https://www.odoo.sh/project", "_blank", "noopener,noreferrer")}
    >
      {t("common.take_me_to_sh")}
    </Button>
  </div>
);

export const ProjectList = () => {
  const { favorites, loading } = usePopup();

  return (
    <>
      <Show when={loading()}>
        <div id="projects" class="flex items-center gap-2 text-sm opacity-80">
          <span class="loading loading-sm loading-spinner" />
          <span>{t("common.loading_favorites")}</span>
        </div>
      </Show>
      <Show when={!loading() && (!favorites() || favorites().length === 0)}>
        <EmptyState />
      </Show>
      <Show when={!loading() && favorites() && favorites()!.length > 0}>
        <div id="projects" class="flex flex-col">
          <For each={favorites()}>{(favorite) => <ProjectItem favorite={favorite} />}</For>
        </div>
      </Show>
    </>
  );
};
