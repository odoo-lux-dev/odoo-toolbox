import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Show, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { StateMessage } from "@/components/ui/status";
import { setSearchQuery } from "@/screens/options/options-nav";
import { t } from "@/services/i18n-service";

import { IconTile, type OptionTone } from "./option-card";

export const PageHeader = (props: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: JSX.Element;
}) => (
  <header class="mb-6 flex flex-col gap-3 sm:mb-9 md:flex-row md:items-start md:justify-between md:gap-6">
    <div class="max-w-162.5">
      <p class="font-mono text-small font-medium tracking-[0.14em] text-ink-3 uppercase rtl:font-sans rtl:tracking-normal">
        {props.eyebrow}
      </p>
      <h1 class="mt-1.25 font-display text-display-sm font-semibold tracking-[-0.04em] sm:text-display">
        {props.title}
      </h1>
      <p class="mt-2 text-xs/relaxed text-pretty text-ink-2 sm:text-title/relaxed">
        {props.description}
      </p>
    </div>
    <Show when={props.meta}>
      <div class="flex flex-row items-center gap-2 md:flex-col md:items-end md:gap-1.5 md:pt-5.75">
        {props.meta}
      </div>
    </Show>
  </header>
);

export const SectionHeader = (props: {
  id: string;
  icon: IconData;
  tone?: OptionTone;
  title: string;
  description: string;
}) => (
  <header data-slot="options-section-header" class="mb-3.75 flex items-center gap-2.75">
    <IconTile icon={props.icon} tone={props.tone} size="lg" />
    <div>
      <h2 id={props.id} class="font-display text-headline font-semibold tracking-tight">
        {props.title}
      </h2>
      <p class="mt-0.5 text-label text-ink-3">{props.description}</p>
    </div>
  </header>
);

/** Search of the options page without result, with a button clearing the query. */
export const NoSearchResults = (props: { title: string; description: string; class?: string }) => (
  <StateMessage
    framed
    headingLevel={2}
    class={props.class}
    icon={<HugeiconsIcon icon={Search01Icon} size={22} strokeWidth={1.8} />}
    title={props.title}
    description={props.description}
    action={
      <Button size="sm" variant="ghost" onClick={() => setSearchQuery("")}>
        <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={1.8} />
        {t("options.search.clear")}
      </Button>
    }
  />
);
