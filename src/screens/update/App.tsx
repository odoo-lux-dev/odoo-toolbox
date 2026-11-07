import {
  Alert02Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  GithubIcon,
  Globe02Icon,
  InformationCircleIcon,
  Loading03Icon,
  Rocket01Icon,
  Settings02Icon,
  SparklesIcon,
  Tick01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import "./style.css";
import { Show, For, createSignal, onCleanup } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Panel } from "@/components/ui/panel";
import { useExtensionTheme } from "@/hooks/use-extension-theme";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { updateService } from "@/services/update-service";
import type { ActivationButtonState, ActivationMethod } from "@/types";
import { GITHUB_REPO_URL } from "@/utils/constants";

const iconMap: Record<string, typeof SparklesIcon> = {
  "wrench-01": Wrench01Icon,
  "rocket-01": Rocket01Icon,
  "chart-bar-line": ChartBarLineIcon,
  "globe-02": Globe02Icon,
  "settings-02": Settings02Icon,
  "alert-02": Alert02Icon,
  "loading-03": Loading03Icon,
  "tick-01": Tick01Icon,
  github: GithubIcon,
};

const getIcon = (iconName?: string) => (iconName && iconMap[iconName]) || SparklesIcon;

const renderIcon = (iconName: string | undefined, size: number, extraClass?: string) => (
  <HugeiconsIcon icon={getIcon(iconName)} size={size} strokeWidth={1.8} class={extraClass} />
);

const getSectionIcon = (type: "info" | "warning" | "success") => {
  switch (type) {
    case "warning":
      return Alert02Icon;
    case "success":
      return Tick01Icon;
    default:
      return InformationCircleIcon;
  }
};

export const App = () => {
  const currentVersion = browser.runtime.getManifest().version;
  const updateInfo = updateService.getUpdateInfo(currentVersion);
  const [buttonStates, setButtonStates] = createSignal<Record<number, ActivationButtonState>>({});
  const setButtonState = (index: number, state: ActivationButtonState | undefined) =>
    setButtonStates((previous) => {
      const next = { ...previous };
      if (state) next[index] = state;
      else delete next[index];
      return next;
    });

  useExtensionTheme();

  let errorTimer: number | undefined;
  onCleanup(() => clearTimeout(errorTimer));

  const openOptions = () => browser.runtime.openOptionsPage();

  const runCustomHandler = async (method: ActivationMethod, index: number) => {
    try {
      await method.customHandler?.((state) => setButtonState(index, state));
    } catch (error) {
      Logger.error("Error executing custom handler:", error);
      setButtonState(index, { text: t("update.error"), icon: "alert-02", disabled: true });
      errorTimer = window.setTimeout(() => setButtonState(index, undefined), 3000);
    }
  };

  const handleActivationMethodClick = (method: ActivationMethod, index: number) => {
    switch (method.action) {
      case "openSettings":
        openOptions();
        break;
      case "openUrl":
        if (method.url) {
          browser.tabs.create({ url: method.url });
          window.close();
        }
        break;
      case "custom":
        void runCustomHandler(method, index);
        break;
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-canvas px-4 py-8 text-ink">
      <Panel class="w-full max-w-2xl p-6 shadow-pop sm:p-8">
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl font-semibold">{updateInfo.title || t("update.title")}</h1>
            <Badge color="primary" size="sm">
              {updateInfo.updateVersion || currentVersion}
            </Badge>
          </div>
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-primary/15 p-3 text-primary">
              <HugeiconsIcon icon={SparklesIcon} size={20} strokeWidth={1.8} />
            </div>
            <p class="text-sm text-ink-2">{updateInfo.description || t("update.default_desc")}</p>
          </div>

          <p class="text-center text-sm text-ink-3">{t("update.only_significant")}</p>

          <Show when={updateInfo.mainFeature}>
            <Panel class="bg-surface-2 p-4">
              <div class="flex items-center gap-4">
                <div class="rounded-lg bg-primary/15 p-2 text-primary">
                  {renderIcon(updateInfo.mainFeature!.icon, 18)}
                </div>
                <div class="flex-1">
                  <h2 class="text-lg font-semibold">{updateInfo.mainFeature!.title}</h2>
                  <p class="text-sm text-ink-2">{updateInfo.mainFeature!.description}</p>
                </div>
              </div>
            </Panel>
          </Show>

          <Show when={updateInfo.activationMethods && updateInfo.activationMethods.length > 0}>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-ink-2">
                <HugeiconsIcon icon={Rocket01Icon} size={16} strokeWidth={1.8} />
                <span>{t("update.how_to_activate")}</span>
              </div>
              <div class="flex flex-col gap-2">
                <For each={updateInfo.activationMethods ?? []}>
                  {(method, index) => {
                    const currentState = () => buttonStates()[index()];
                    const displayText = () => currentState()?.text || method.text;
                    const displayIconName = () => currentState()?.icon || method.icon;
                    const isDisabled = () => currentState()?.disabled || false;
                    const isClickable = () => !!method.action && !isDisabled();
                    const iconExtraClass = () =>
                      displayIconName()?.startsWith("loading") ? "animate-spin" : undefined;

                    return (
                      <Show
                        when={isClickable()}
                        fallback={
                          <div
                            class={`flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm ${isDisabled() ? "opacity-60" : ""}`}
                          >
                            {renderIcon(displayIconName(), 16, iconExtraClass())}
                            <span>{displayText()}</span>
                          </div>
                        }
                      >
                        <Button
                          variant="outline"
                          color="primary"
                          block
                          class="justify-start gap-3"
                          disabled={isDisabled()}
                          onClick={() => handleActivationMethodClick(method, index())}
                        >
                          {renderIcon(displayIconName(), 16, iconExtraClass())}
                          <span>{displayText()}</span>
                        </Button>
                      </Show>
                    );
                  }}
                </For>
              </div>
            </div>
          </Show>

          <Show when={updateInfo.customSections && updateInfo.customSections.length > 0}>
            <div class="flex flex-col gap-3">
              <For each={updateInfo.customSections ?? []}>
                {(section) => (
                  <Alert
                    color={section.type}
                    variant="soft"
                    icon={
                      <HugeiconsIcon
                        icon={getSectionIcon(section.type)}
                        size={18}
                        strokeWidth={1.8}
                      />
                    }
                    title={section.title}
                  >
                    <div class="text-sm text-ink-2" innerHTML={section.content} />
                  </Alert>
                )}
              </For>
            </div>
          </Show>

          <Show when={updateInfo.notes.length > 0}>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-ink-2">
                <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={1.8} />
                <span>{t("update.whats_new")}</span>
              </div>
              <ul class="space-y-2 text-sm text-ink-2">
                <For each={updateInfo.notes}>
                  {(note) => (
                    <li class="flex items-center gap-2">
                      <span class="mt-1 size-2 rounded-full bg-primary/70" />
                      <span>{note}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>

          <div class="flex flex-wrap gap-3">
            <Button color="primary" class="flex-1 gap-2" onClick={openOptions}>
              <HugeiconsIcon icon={Settings02Icon} size={16} strokeWidth={1.8} />
              {t("update.open_settings")}
            </Button>
            <div class="flex w-full gap-2">
              <Button
                variant="outline"
                color="secondary"
                class="flex-1 gap-2"
                onClick={() =>
                  browser.tabs.create({ url: `${GITHUB_REPO_URL}/releases/tag/v${currentVersion}` })
                }
              >
                <HugeiconsIcon icon={BookOpen01Icon} size={16} strokeWidth={1.8} />
                {t("update.changelog")}
              </Button>
              <Button
                variant="outline"
                class="flex-1 gap-2"
                onClick={() => browser.tabs.create({ url: GITHUB_REPO_URL })}
              >
                <HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={1.8} />
                {t("update.github")}
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};
