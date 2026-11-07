import {
  Blockchain01Icon,
  Blockchain02Icon,
  Copy01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { createResource, createSignal, For, Show } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import {
  getBaseView,
  getInheritedViews,
  type ViewRecord,
} from "@/services/content-script-rpc-service";
import { copyWithFeedback } from "@/utils/clipboard";
import { t } from "@/utils/i18n-page";

import { AsyncModal } from "./async-modal";
import { CopyValue, DetailRow, OptionalCopyValue, SectionTitle } from "./detail-parts";
import { formatXml, highlightXml } from "./xml-format";

interface ViewModalProps {
  open: boolean;
  onClose: () => void;
  model: string;
  viewType: string;
}

const moduleOf = (xmlId: string | false) => {
  const dotIndex = xmlId ? xmlId.indexOf(".") : -1;
  return xmlId && dotIndex > 0 ? xmlId.slice(0, dotIndex) : null;
};

const loadViews = async ({ model, viewType }: { model: string; viewType: string }) => {
  const base = await getBaseView(model, viewType);
  if (!base) throw new Error(t("technical_list.view_modal.not_found"));
  return { base, inherited: await getInheritedViews(base.id) };
};

const ViewCard = (props: { view: ViewRecord; onShowArch: () => void }) => (
  <div class="rounded-lg border border-base-300 p-3">
    <div class="flex items-start justify-between gap-2">
      <span class="truncate text-sm font-medium" title={props.view.name}>
        {props.view.name}
      </span>
      <Show when={moduleOf(props.view.xml_id)}>
        {(module) => (
          <Badge size="sm" variant="outline" color="accent">
            {module()}
          </Badge>
        )}
      </Show>
    </div>
    <div class="mt-2 space-y-1">
      <DetailRow label={t("technical_list.view_modal.xml_id")}>
        <OptionalCopyValue value={props.view.xml_id} />
      </DetailRow>
      <Show when={props.view.key !== props.view.xml_id && props.view.key}>
        {(key) => (
          <DetailRow label={t("technical_list.view_modal.key")}>
            <CopyValue value={key()} />
          </DetailRow>
        )}
      </Show>
      <DetailRow label={t("technical_list.view_modal.priority")}>{props.view.priority}</DetailRow>
    </div>
    <Show when={props.view.arch_db}>
      <div class="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="xs"
          class="gap-1 text-xs"
          onClick={props.onShowArch}
          type="button"
        >
          <HugeiconsIcon icon={ViewIcon} size={12} strokeWidth={1.6} />
          {t("technical_list.view_modal.view_arch")}
        </Button>
      </div>
    </Show>
  </div>
);

const ArchModal = (props: { view: ViewRecord | null; onClose: () => void }) => {
  const arch = () => (props.view?.arch_db ? formatXml(props.view.arch_db) : "");

  return (
    <Modal
      open={!!props.view}
      onClose={props.onClose}
      title={t("technical_list.view_modal.arch_title", [props.view?.name ?? ""])}
      size="full"
      boxClass="max-w-[900px]"
    >
      <Show
        when={arch()}
        fallback={<p class="text-xs opacity-60">{t("technical_list.view_modal.no_arch")}</p>}
      >
        {(content) => (
          <div class="relative mt-3">
            <Button
              variant="ghost"
              size="xs"
              class="absolute inset-e-2 top-2 z-10 gap-1 bg-base-100/80 text-xs backdrop-blur-sm"
              onClick={(event) => copyWithFeedback(content(), event.currentTarget)}
              title={t("technical_list.view_modal.copy_arch")}
            >
              <HugeiconsIcon icon={Copy01Icon} size={12} strokeWidth={1.6} />
              {t("technical_list.view_modal.copy_arch")}
            </Button>
            <pre class="max-h-[60vh] overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs/5">
              <code class="border-0! bg-transparent!" innerHTML={highlightXml(content())} />
            </pre>
          </div>
        )}
      </Show>
    </Modal>
  );
};

export const ViewModal = (props: ViewModalProps) => {
  const [archView, setArchView] = createSignal<ViewRecord | null>(null);
  const [views] = createResource(
    () => props.open && { model: props.model, viewType: props.viewType },
    loadViews,
  );

  return (
    <>
      <AsyncModal
        open={props.open}
        onClose={props.onClose}
        title={t("technical_list.view_modal.title", [props.model])}
        size="lg"
        boxClass="max-w-[700px]"
        loadingLabel={t("technical_list.view_modal.loading")}
        data={views}
      >
        {(loaded) => (
          <div class="space-y-4">
            <section>
              <SectionTitle
                icon={Blockchain01Icon}
                title={t("technical_list.view_modal.base_view")}
              />
              <ViewCard view={loaded.base} onShowArch={() => setArchView(loaded.base)} />
            </section>
            <section>
              <SectionTitle
                icon={Blockchain02Icon}
                title={t("technical_list.view_modal.inherited_views")}
              />
              <Show
                when={loaded.inherited.length > 0}
                fallback={
                  <p class="text-xs opacity-60">{t("technical_list.view_modal.no_inherited")}</p>
                }
              >
                <div class="space-y-2">
                  <For each={loaded.inherited}>
                    {(view) => <ViewCard view={view} onShowArch={() => setArchView(view)} />}
                  </For>
                </div>
              </Show>
            </section>
          </div>
        )}
      </AsyncModal>
      <ArchModal view={archView()} onClose={() => setArchView(null)} />
    </>
  );
};
