import {
  Copy01Icon,
  ViewIcon,
  Blockchain01Icon,
  Blockchain02Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createSignal, For, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getBaseView, getInheritedViews } from "@/services/content-script-rpc-service";
import type { ViewRecord } from "@/types";
import { t } from "@/utils/i18n-page";

interface ViewModalProps {
  open: boolean;
  onClose: () => void;
  model: string;
  viewType: string;
}

const extractModule = (xmlId: string | false): string | null => {
  if (!xmlId) return null;
  const dotIndex = xmlId.indexOf(".");
  return dotIndex > 0 ? xmlId.substring(0, dotIndex) : null;
};

function formatXml(xml: string): string {
  if (!xml) return "";
  if (xml.includes("\n")) return xml;
  let formatted = "";
  let indent = 0;
  xml.split(/(?=<)/).forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("</")) indent = Math.max(0, indent - 1);
    formatted += "  ".repeat(indent) + trimmed + "\n";
    if (
      trimmed.startsWith("<") &&
      !trimmed.startsWith("</") &&
      !trimmed.endsWith("/>") &&
      !trimmed.startsWith("<?") &&
      !trimmed.startsWith("<!")
    ) {
      indent++;
    }
  });
  return formatted.trim();
}

function highlightXml(xml: string): string {
  if (!xml) return "";
  const escaped = xml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([\w.:-]+)|\s([\w.:-]+)(=)|"([^"]*)"/g,
    (match, comment, tagOpen, tagName, attrName, equals, strValue) => {
      if (comment) return `<span style="color: #6b7280; opacity: 0.6;">${comment}</span>`;
      if (tagName) return `${tagOpen}<span style="color: #a855f7;">${tagName}</span>`;
      if (attrName) return ` <span style="color: #3b82f6;">${attrName}</span>${equals}`;
      if (strValue !== undefined) return `<span style="color: #10b981;">"${strValue}"</span>`;
      return match;
    },
  );
}

const CopyableValue = (props: {
  value: string;
  onCopy: (value: string, e: MouseEvent) => void;
}) => (
  <code
    class="cursor-pointer rounded-sm bg-base-200/60 px-1 break-all transition-colors hover:bg-primary hover:text-primary-content"
    onClick={(e) => props.onCopy(props.value, e)}
    title={t("technical_list.info_item.click_to_copy")}
  >
    {props.value}
  </code>
);

const DetailRow = (props: { label: string; children: any }) => (
  <div class="flex items-start justify-between gap-4 py-0.5">
    <span class="text-xs font-medium whitespace-nowrap text-base-content/60">{props.label}</span>
    <div class="text-end text-xs text-base-content/80">{props.children}</div>
  </div>
);

const ViewArchButton = (props: { arch: string | false | undefined; onClick: () => void }) => (
  <Show when={props.arch}>
    <div class="mt-2 flex justify-end">
      <Button variant="ghost" size="xs" class="gap-1 text-xs" onClick={props.onClick} type="button">
        <HugeiconsIcon icon={ViewIcon} size={12} color="currentColor" strokeWidth={1.6} />
        {t("technical_list.view_modal.view_arch")}
      </Button>
    </div>
  </Show>
);

export const ViewModal = (props: ViewModalProps) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [baseView, setBaseView] = createSignal<ViewRecord | null>(null);
  const [inheritedViews, setInheritedViews] = createSignal<ViewRecord[]>([]);
  const [showArchModal, setShowArchModal] = createSignal(false);
  const [archTitle, setArchTitle] = createSignal("");
  const [archContent, setArchContent] = createSignal("");
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopy = (value: string, e: MouseEvent) => {
    copyToClipboard(value, e.currentTarget as HTMLElement);
  };

  const openArchModal = (name: string, arch: string | false | undefined) => {
    setArchTitle(name);
    setArchContent(arch ? formatXml(arch) : "");
    setShowArchModal(true);
  };

  createEffect(() => {
    if (props.open && props.model && props.viewType) {
      fetchData(props.model, props.viewType);
    }
  });

  const fetchData = async (model: string, viewType: string) => {
    setLoading(true);
    setError(null);
    setBaseView(null);
    setInheritedViews([]);
    try {
      const base = await getBaseView(model, viewType);
      if (!base) {
        setError(t("technical_list.view_modal.not_found"));
        return;
      }
      setBaseView(base);

      const inherited = await getInheritedViews(base.id);
      setInheritedViews(inherited);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t("technical_list.view_modal.title", [props.model])}
        size="lg"
        boxClass="max-w-[700px]"
      >
        <div class="max-h-[70vh] overflow-auto">
          <Show
            when={!loading()}
            fallback={
              <Alert color="info" variant="outline" class="items-start">
                <span class="text-sm">{t("technical_list.view_modal.loading")}</span>
              </Alert>
            }
          >
            <Show
              when={!error()}
              fallback={
                <Alert color="error" variant="outline" class="items-start">
                  <span class="text-sm">{error()}</span>
                </Alert>
              }
            >
              <Show when={baseView()}>
                {(view) => {
                  const module = () => extractModule(view().xml_id);
                  return (
                    <div class="mt-3 space-y-4">
                      <section>
                        <div class="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                          <HugeiconsIcon
                            icon={Blockchain01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                          />
                          {t("technical_list.view_modal.base_view")}
                        </div>
                        <div class="rounded-lg border border-base-300 p-3">
                          <div class="flex items-start justify-between gap-2">
                            <span class="truncate text-sm font-medium" title={view().name}>
                              {view().name}
                            </span>
                            <Show when={module()}>
                              <Badge size="sm" variant="outline" color="accent">
                                {module()}
                              </Badge>
                            </Show>
                          </div>
                          <div class="mt-2 space-y-1">
                            <DetailRow label={t("technical_list.view_modal.xml_id")}>
                              <Show
                                when={view().xml_id}
                                fallback={<span class="text-base-content/30">—</span>}
                              >
                                {(xmlId) => <CopyableValue value={xmlId()} onCopy={handleCopy} />}
                              </Show>
                            </DetailRow>
                            <Show
                              when={view().key && view().key !== view().xml_id ? view().key : null}
                            >
                              {(key) => (
                                <DetailRow label={t("technical_list.view_modal.key")}>
                                  <CopyableValue value={key()} onCopy={handleCopy} />
                                </DetailRow>
                              )}
                            </Show>
                            <DetailRow label={t("technical_list.view_modal.priority")}>
                              {view().priority}
                            </DetailRow>
                          </div>
                          <ViewArchButton
                            arch={view().arch_db}
                            onClick={() => openArchModal(view().name, view().arch_db)}
                          />
                        </div>
                      </section>

                      <section>
                        <div class="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                          <HugeiconsIcon
                            icon={Blockchain02Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                          />
                          {t("technical_list.view_modal.inherited_views")}
                        </div>
                        <Show
                          when={inheritedViews().length > 0}
                          fallback={
                            <p class="text-xs opacity-60">
                              {t("technical_list.view_modal.no_inherited")}
                            </p>
                          }
                        >
                          <div class="space-y-2">
                            <For each={inheritedViews()}>
                              {(inherited) => {
                                const inheritedModule = () => extractModule(inherited.xml_id);
                                return (
                                  <div class="rounded-lg border border-base-300 p-3">
                                    <div class="flex items-start justify-between gap-2">
                                      <span
                                        class="truncate text-sm font-medium"
                                        title={inherited.name}
                                      >
                                        {inherited.name}
                                      </span>
                                      <Show when={inheritedModule()}>
                                        <Badge size="sm" variant="outline" color="accent">
                                          {inheritedModule()}
                                        </Badge>
                                      </Show>
                                    </div>
                                    <div class="mt-2 space-y-1">
                                      <DetailRow label={t("technical_list.view_modal.xml_id")}>
                                        <Show
                                          when={inherited.xml_id}
                                          fallback={<span class="text-base-content/30">—</span>}
                                        >
                                          {(xmlId) => (
                                            <CopyableValue value={xmlId()} onCopy={handleCopy} />
                                          )}
                                        </Show>
                                      </DetailRow>
                                      <Show
                                        when={
                                          inherited.key && inherited.key !== inherited.xml_id
                                            ? inherited.key
                                            : null
                                        }
                                      >
                                        {(key) => (
                                          <DetailRow label={t("technical_list.view_modal.key")}>
                                            <CopyableValue value={key()} onCopy={handleCopy} />
                                          </DetailRow>
                                        )}
                                      </Show>
                                      <DetailRow label={t("technical_list.view_modal.priority")}>
                                        {inherited.priority}
                                      </DetailRow>
                                    </div>
                                    <ViewArchButton
                                      arch={inherited.arch_db}
                                      onClick={() =>
                                        openArchModal(inherited.name, inherited.arch_db)
                                      }
                                    />
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </Show>
                      </section>
                    </div>
                  );
                }}
              </Show>
            </Show>
          </Show>
        </div>
      </Modal>
      <Modal
        open={showArchModal()}
        onClose={() => setShowArchModal(false)}
        title={t("technical_list.view_modal.arch_title", [archTitle()])}
        size="full"
        boxClass="max-w-[900px]"
      >
        <Show
          when={archContent()}
          fallback={<p class="text-xs opacity-60">{t("technical_list.view_modal.no_arch")}</p>}
        >
          {(content) => (
            <div class="relative mt-3">
              <Button
                variant="ghost"
                size="xs"
                class="absolute inset-e-2 top-2 z-10 gap-1 bg-base-100/80 text-xs backdrop-blur-sm"
                onClick={(e) => handleCopy(content(), e)}
                title={t("technical_list.view_modal.copy_arch")}
              >
                <HugeiconsIcon icon={Copy01Icon} size={12} color="currentColor" strokeWidth={1.6} />
                {t("technical_list.view_modal.copy_arch")}
              </Button>
              <pre class="max-h-[60vh] overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs/5">
                <code class="border-0! bg-transparent!" innerHTML={highlightXml(content())} />
              </pre>
            </div>
          )}
        </Show>
      </Modal>
    </>
  );
};
