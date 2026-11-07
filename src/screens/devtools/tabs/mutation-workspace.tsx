import { Alert02Icon, CodeIcon } from "@hugeicons/core-free-icons";
import { Show, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { PanelHeader } from "@/components/ui/panel";
import { Note } from "@/components/ui/status";
import {
  Eyebrow,
  JsonStatus,
  Panel,
  QueryWorkspace,
  WorkspaceBody,
  WorkspaceHeader,
} from "@/screens/devtools/components/devtools-ui";
import { JsonCodeEditor } from "@/screens/devtools/components/json-code-editor";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { queryStore, railFieldsMetadata, resultStore } from "@/screens/devtools/devtools-signals";
import type { createJsonDraft } from "@/screens/devtools/drafts";
import { t } from "@/services/i18n-service";

interface MutationWorkspaceProps {
  rail: JSX.Element;
  title: string;
  headerActions?: JSX.Element;
  warningTitle: string;
  warningText: string;
  /** Caption of the result preview once records are loaded. */
  caption: (model: string | null, count: number) => JSX.Element;
  children: JSX.Element;
}

/** Shell of the write, create, call-method and unlink tabs. */
export const MutationWorkspace = (props: MutationWorkspaceProps) => (
  <QueryWorkspace rail={props.rail}>
    {/* Model only: the record ids are already in the rail and a long list shifts the header */}
    <WorkspaceHeader
      title={props.title}
      path={queryStore.model || undefined}
      actions={props.headerActions}
    />

    <WorkspaceBody>
      <Note
        icon={<HugeiconsIcon icon={Alert02Icon} size={16} strokeWidth={1.6} />}
        title={props.warningTitle}
      >
        {props.warningText}
      </Note>

      {props.children}

      <ResultViewer
        embedded
        caption={
          <Show when={resultStore.data?.length}>
            {(count) => props.caption(resultStore.model, count())}
          </Show>
        }
      />
    </WorkspaceBody>
  </QueryWorkspace>
);

type JsonDraft = ReturnType<typeof createJsonDraft>;

/** Format / Clear buttons of a JSON draft, for the workspace header. */
export const JsonDraftActions = (props: { draft: JsonDraft; busy: boolean }) => (
  <>
    <Button
      variant="outline"
      size="sm"
      class="gap-1.5 border-line bg-surface"
      onClick={props.draft.format}
      disabled={props.draft.isEmpty() || props.busy}
    >
      <HugeiconsIcon icon={CodeIcon} size={15} strokeWidth={1.6} />
      {t("devtools.write.format_json")}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      class="text-ink-2"
      onClick={props.draft.clear}
      disabled={props.draft.isEmpty() || props.busy}
    >
      {t("common.clear")}
    </Button>
  </>
);

/** JSON editor panel of a draft, validated against the fields of the rail model. */
export const JsonDraftPanel = (props: {
  draft: JsonDraft;
  placeholder: string;
  onAddRequiredFields?: () => void;
}) => (
  <Panel class="shrink-0 transition-colors duration-150 ease-theme focus-within:border-accent">
    <PanelHeader
      start={<Eyebrow>JSON</Eyebrow>}
      end={
        <JsonStatus
          isEmpty={props.draft.isEmpty()}
          isValid={props.draft.validation().isValid}
          validLabel={t("devtools.json_editor.valid")}
          error={props.draft.validation().error}
        />
      }
    />
    <JsonCodeEditor
      value={props.draft.value()}
      onChange={props.draft.setValue}
      fieldsMetadata={railFieldsMetadata() || {}}
      disabled={resultStore.loading}
      class="min-h-44"
      placeholder={props.placeholder}
      onAddRequiredFields={props.onAddRequiredFields}
    />
  </Panel>
);
