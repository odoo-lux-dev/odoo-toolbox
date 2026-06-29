import { ComputerIcon, TranslateIcon } from "@hugeicons/core-free-icons";
import { createSignal, For, Show, onMount, onCleanup } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  t,
  changeLanguage,
  SUPPORTED_LOCALES,
  AUTO_LOCALE,
  getLocaleLabel,
  type SupportedLocale,
} from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";

const LOCALE_OPTIONS: (
  | { value: string; isAuto: true }
  | { value: SupportedLocale; isAuto: false }
)[] = [
  { value: AUTO_LOCALE, isAuto: true },
  ...SUPPORTED_LOCALES.map((l) => ({ value: l, isAuto: false as const })),
];

export const LanguageSwitcher = () => {
  const [storedLocale, setStoredLocale] = createSignal<string>("en");
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  onMount(async () => {
    setStoredLocale(await settingsService.getUserLocale());
  });

  onCleanup(() => {
    if (containerRef) {
      document.removeEventListener("click", handleClickOutside);
    }
  });

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const toggle = () => {
    const willOpen = !isOpen();
    setIsOpen(willOpen);
    if (willOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  };

  const handleSelect = async (locale: string) => {
    setStoredLocale(locale);
    setIsOpen(false);
    document.removeEventListener("click", handleClickOutside);
    await changeLanguage(locale);
  };

  const currentDisplay = () => {
    const stored = storedLocale();
    if (stored === AUTO_LOCALE) {
      return {
        icon: (
          <HugeiconsIcon icon={ComputerIcon} size={16} color="currentColor" strokeWidth={1.8} />
        ),
        label: t("options.settings.language_auto"),
      };
    }
    const locale = stored as SupportedLocale;
    const info = getLocaleLabel(locale);
    return { icon: <span class="emoji-font text-base">{info.flag}</span>, label: info.label };
  };

  return (
    <div ref={containerRef} class="relative">
      <Button
        variant="ghost"
        size="sm"
        circle
        onClick={toggle}
        title={t("options.settings.language")}
      >
        <Show when={storedLocale() === AUTO_LOCALE} fallback={currentDisplay().icon}>
          <HugeiconsIcon icon={ComputerIcon} size={16} color="currentColor" strokeWidth={1.8} />
        </Show>
      </Button>
      <Show when={isOpen()}>
        <div class="absolute -inset-s-2 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg">
          <div class="flex items-center gap-2 border-b border-base-200 px-3 py-1.5 text-xs font-medium text-base-content/60">
            <HugeiconsIcon icon={TranslateIcon} size={14} color="currentColor" strokeWidth={1.8} />
            {t("options.settings.language")}
          </div>
          <For each={LOCALE_OPTIONS}>
            {(option) => {
              const isAuto = option.isAuto;
              const isActive = storedLocale() === option.value;
              return (
                <button
                  class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-base-200"
                  classList={{
                    "bg-primary/10 text-primary": isActive,
                    "text-base-content": !isActive,
                  }}
                  onClick={() => handleSelect(option.value)}
                >
                  <span class="flex w-5 items-center justify-center">
                    {isAuto ? (
                      <HugeiconsIcon
                        icon={ComputerIcon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <span class="emoji-font text-base">
                        {getLocaleLabel(option.value as SupportedLocale).flag}
                      </span>
                    )}
                  </span>
                  <span class="flex-1 text-start">
                    {isAuto
                      ? t("options.settings.language_auto")
                      : getLocaleLabel(option.value as SupportedLocale).label}
                  </span>
                  <Show when={isActive}>
                    <span class="text-primary">✓</span>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
