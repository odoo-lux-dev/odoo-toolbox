import { ArrowDown01Icon, Tick02Icon, TranslateIcon } from "@hugeicons/core-free-icons";
import { createSignal, For, Show, onCleanup } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useSettings } from "@/hooks/use-settings";
import { AUTO_LOCALE, SUPPORTED_LOCALES } from "@/services/i18n-locales";
import { t, changeLanguage, getLocaleLabel } from "@/services/i18n-service";

export const LOCALE_OPTIONS = [AUTO_LOCALE, ...SUPPORTED_LOCALES] as string[];

/** BCP 47 tag of a locale (`pt-BR`), `undefined` for the automatic one. */
export const localeTag = (locale: string) =>
  locale === AUTO_LOCALE ? undefined : locale.replace("_", "-");

const localeCode = (locale: string) => localeTag(locale) ?? t("options.shell.language_auto_short");

/** Flag emoji, or the translate icon for the automatic locale. */
const LocaleFlag = (props: { locale: string }) => (
  <Show
    when={props.locale !== AUTO_LOCALE}
    fallback={
      <span class="text-ink-3">
        <HugeiconsIcon icon={TranslateIcon} size={14} strokeWidth={1.8} />
      </span>
    }
  >
    <span class="font-emoji text-sm leading-none" aria-hidden="true">
      {getLocaleLabel(props.locale).flag}
    </span>
  </Show>
);

export const localeName = (locale: string) =>
  locale === AUTO_LOCALE ? t("options.settings.language_auto") : getLocaleLabel(locale).label;

export const LanguageSwitcher = () => {
  const settings = useSettings();
  const [pendingLocale, setPendingLocale] = createSignal<string>();
  const storedLocale = () => pendingLocale() ?? settings().userLocale;
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;
  let buttonRef: HTMLButtonElement | undefined;
  let listRef: HTMLDivElement | undefined;

  const options = () => [...(listRef?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
  const focusOption = (index: number) => {
    const items = options();
    items[(index + items.length) % items.length]?.focus();
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef && !containerRef.contains(e.target as Node)) close();
  };

  /** Listbox keyboard support: ↑/↓/Home/End move, Esc closes, Tab leaves. */
  const handleKeyDown = (e: KeyboardEvent) => {
    const items = options();
    const current = items.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "Escape":
        close();
        buttonRef?.focus();
        return;
      case "Tab":
        close();
        return;
      case "ArrowDown":
        focusOption(current + 1);
        break;
      case "ArrowUp":
        focusOption(current === -1 ? -1 : current - 1);
        break;
      case "Home":
        focusOption(0);
        break;
      case "End":
        focusOption(-1);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const open = () => {
    setIsOpen(true);
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    // Start on the selected language
    queueMicrotask(() => {
      const selected = options().findIndex((item) => item.getAttribute("aria-selected") === "true");
      focusOption(Math.max(selected, 0));
    });
  };

  const close = () => {
    setIsOpen(false);
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };

  onCleanup(close);

  const handleSelect = async (locale: string) => {
    setPendingLocale(locale);
    close();
    buttonRef?.focus();
    await changeLanguage(locale);
    setPendingLocale(undefined);
  };

  return (
    <div ref={(el) => (containerRef = el)} class="relative">
      <button
        ref={(el) => (buttonRef = el)}
        type="button"
        class="inline-flex h-target cursor-pointer items-center gap-1.25 rounded-field border border-line bg-surface px-2 text-ink-2 transition-colors duration-150 ease-theme hover:border-line-strong hover:bg-surface-3 hover:text-ink max-sm:w-target max-sm:justify-center max-sm:px-0"
        aria-haspopup="listbox"
        aria-expanded={isOpen()}
        aria-label={`${t("options.settings.language")}: ${localeName(storedLocale())}`}
        title={t("options.settings.language")}
        onClick={() => (isOpen() ? close() : open())}
      >
        <LocaleFlag locale={storedLocale()} />
        <span class="font-mono text-caption font-semibold tracking-[0.04em] uppercase max-sm:hidden">
          {localeCode(storedLocale())}
        </span>
        <span
          class={cx(
            "text-ink-4 transition-transform duration-150 max-sm:hidden",
            isOpen() ? "rotate-180" : undefined,
          )}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={11} strokeWidth={2} />
        </span>
      </button>
      <Show when={isOpen()}>
        <div
          ref={(el) => (listRef = el)}
          role="listbox"
          aria-label={t("options.settings.language")}
          class="absolute inset-e-0 top-[calc(100%+7px)] z-50 max-h-[min(430px,calc(100vh-78px))] w-58 max-w-[calc(100vw-24px)] overflow-y-auto rounded-box border border-line bg-surface p-1.25 shadow-overlay"
        >
          <p class="px-2 pt-1.75 pb-1.25 font-mono text-caption font-medium tracking-widest text-ink-3 uppercase rtl:font-sans rtl:tracking-normal">
            {t("options.settings.language")}
          </p>
          <For each={LOCALE_OPTIONS}>
            {(locale) => {
              const isActive = () => storedLocale() === locale;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive() ? "true" : "false"}
                  tabIndex={-1}
                  lang={localeTag(locale)}
                  class={cx(
                    "flex min-h-control-sm w-full cursor-pointer items-center gap-2 rounded-tight px-2 py-1.5 text-start text-label transition-colors duration-150 ease-theme",
                    isActive()
                      ? "bg-primary-soft font-semibold text-primary"
                      : "text-ink-2 hover:bg-surface-3 hover:text-ink",
                  )}
                  onClick={() => handleSelect(locale)}
                >
                  <span class="grid w-4 flex-none place-items-center">
                    <LocaleFlag locale={locale} />
                  </span>
                  <span class="flex-1">{localeName(locale)}</span>
                  <span
                    class={cx(
                      "font-mono text-micro uppercase",
                      isActive() ? "text-primary" : "text-ink-3",
                    )}
                  >
                    {localeCode(locale)}
                  </span>
                  <span class={cx("text-primary", isActive() ? undefined : "opacity-0")}>
                    <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2} />
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
