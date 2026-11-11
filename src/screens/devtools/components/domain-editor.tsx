import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { createMemo, createSignal, Show } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { QuickDomainButtons } from "@/screens/devtools/components/quick-domains";
import { queryStore, resultStore, setQueryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { domainError, validateDomain } from "@/utils/query-validation";

/** `added` AND-ed with `current`; replaces `current` when either one can't be parsed. */
const combineDomains = (current: string, added: string): string => {
  const currentDomain = validateDomain(current);
  const addedDomain = validateDomain(added);
  if (!currentDomain.isValid || !addedDomain.isValid || currentDomain.domain.length === 0) {
    return added;
  }
  return JSON.stringify(["&", ...currentDomain.domain, ...addedDomain.domain]);
};

/** Help button of the domain field label, with its format help modal. */
export const DomainHelpButton = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <>
      <IconButton
        type="button"
        label={t("devtools.domain_editor.help_label")}
        title={t("devtools.domain_editor.help_label")}
        variant="ghost"
        size="xs"
        circle={false}
        class="text-ink-3 hover:text-ink"
        onClick={() => setOpen(true)}
        icon={<HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={1.8} />}
      />
      <DomainHelpModal open={open()} onClose={() => setOpen(false)} />
    </>
  );
};

const DomainHelpModal = (props: { open: boolean; onClose: () => void }) => (
  <Modal
    open={props.open}
    onClose={props.onClose}
    title={t("devtools.domain_editor.help_title")}
    size="lg"
  >
    <div class="mt-3 space-y-2 text-ui text-base-content/70 [&_code]:rounded-sm [&_code]:bg-base-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono">
      <p>
        <strong>{t("devtools.domain_editor.python_supported")}</strong>
      </p>
      <p>{t("devtools.domain_editor.format_intro")}</p>

      <div class="my-3 flex flex-col gap-3">
        <div class="space-y-2">
          <h4 class="text-ui font-semibold text-base-content">
            {t("devtools.domain_editor.json_format")}
          </h4>
          <ul class="list-disc space-y-1 ps-4">
            <li>
              <code>[["name", "ilike", "test"]]</code>
            </li>
            <li>
              <code>["&", ["active", "=", true], ["name", "!=", false]]</code>
            </li>
          </ul>
        </div>

        <div class="space-y-2">
          <h4 class="text-ui font-semibold text-base-content">
            {t("devtools.domain_editor.python_format")}
          </h4>
          <ul class="list-disc space-y-1 ps-4">
            <li>
              <code>[('name', 'ilike', 'test')]</code>
            </li>
            <li>
              <code>[('active', '=', True), ('name', '!=', False)]</code>
            </li>
          </ul>
        </div>
      </div>

      <p>{t("devtools.domain_editor.operators")}</p>
      <ul class="list-disc space-y-1 ps-4">
        <li>
          <code>"&"</code> - {t("devtools.domain_editor.and_operator")}
        </li>
        <li>
          <code>"|"</code> - {t("devtools.domain_editor.or_operator")}
        </li>
        <li>
          <code>"!"</code> - {t("devtools.domain_editor.not_operator")}
        </li>
      </ul>
      <p>
        {t("devtools.domain_editor.conditions_format")}
        <code>["field", "operator", value]</code>
      </p>
      <p>
        {t("devtools.domain_editor.common_operators")}
        <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>like</code>,{" "}
        <code>ilike</code>, <code>in</code>
      </p>
    </div>
  </Modal>
);

export const DomainEditor = (props: { placeholder?: string }) => {
  const error = createMemo(() => domainError(queryStore.domain));

  return (
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1.5">
        <div
          class={`relative textarea flex min-h-16 w-full overflow-hidden bg-surface-inset p-0 ${
            error() ? "textarea-error" : ""
          }`}
        >
          <Textarea
            value={queryStore.domain}
            onInput={(e) => setQueryStore("domain", e.currentTarget.value)}
            placeholder={props.placeholder ?? t("devtools.domain_editor.placeholder")}
            class="min-h-16 flex-1 resize-y border-0 bg-transparent px-2.5 py-1.5 font-mono text-ui/relaxed whitespace-pre shadow-none focus:shadow-none"
            wrap="off"
            spellcheck={false}
            rows={1}
            disabled={resultStore.loading}
            variant="ghost"
          />
        </div>
        <Show when={error()}>
          <div class="text-small whitespace-pre-wrap text-error-ink">{error()}</div>
        </Show>
      </div>

      <QuickDomainButtons
        onDomainSelect={(domain) =>
          setQueryStore("domain", combineDomains(queryStore.domain, domain))
        }
      />
    </div>
  );
};
