import {
  Alert02Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  GithubIcon,
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
import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { updateService } from "@/services/update-service";
import { ActivationMethod } from "@/types";

const iconMap: Record<string, typeof SparklesIcon> = {
  "wrench-01": Wrench01Icon,
  "rocket-01": Rocket01Icon,
  "chart-bar-line": ChartBarLineIcon,
  "settings-02": Settings02Icon,
  "alert-02": Alert02Icon,
  "loading-03": Loading03Icon,
  "tick-01": Tick01Icon,
  github: GithubIcon,
};

const getIcon = (iconName?: string) => (iconName && iconMap[iconName]) || SparklesIcon;

const renderIcon = (iconName: string | undefined, size: number, extraClass?: string) => (
  <HugeiconsIcon
    icon={getIcon(iconName)}
    size={size}
    color="currentColor"
    strokeWidth={1.8}
    class={extraClass}
  />
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
  const [buttonStates, setButtonStates] = createSignal<
    Record<
      number,
      {
        text: string;
        icon: string;
        disabled?: boolean;
      }
    >
  >({});

  const applyTheme = (extensionTheme?: string) => {
    const themeName = extensionTheme === "light" ? "odoolight" : "odoodark";
    document.documentElement.setAttribute("data-theme", themeName);
  };

  settingsService.getSettings().then((settings) => {
    applyTheme(settings.extensionTheme);
  });

  const unwatch = settingsService.watchSettings((newSettings) => {
    if (!newSettings) return;
    applyTheme(newSettings.extensionTheme);
  });

  onCleanup(() => {
    unwatch();
  });

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const openGitHub = () => {
    browser.tabs.create({
      url: "https://github.com/odoo-lux-dev/odoo-toolbox",
    });
  };

  const openChangelog = () => {
    browser.tabs.create({
      url: `https://github.com/odoo-lux-dev/odoo-toolbox/releases/tag/v${currentVersion}`,
    });
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
        if (method.customHandler && typeof method.customHandler === "function") {
          try {
            const updateButtonState = (newState: {
              text: string;
              icon: string;
              disabled?: boolean;
            }) => {
              setButtonStates((prev) => ({
                ...prev,
                [index]: newState,
              }));
            };
            method.customHandler(updateButtonState);
          } catch (error) {
            Logger.error("Error executing custom handler:", error);
            setButtonStates((prev) => ({
              ...prev,
              [index]: {
                text: t("update.error"),
                icon: "alert-02",
                disabled: true,
              },
            }));
            setTimeout(() => {
              setButtonStates((prev) => {
                const newStates = { ...prev };
                delete newStates[index];
                return newStates;
              });
            }, 3000);
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-8 text-base-content">
      <Card class="w-full max-w-2xl bg-base-100 shadow-xl">
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-2xl font-semibold">{updateInfo.title || t("update.title")}</h1>
            <Badge color="primary" size="sm">
              {updateInfo.updateVersion || currentVersion}
            </Badge>
          </div>
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-primary/15 p-3 text-primary">
              <HugeiconsIcon icon={SparklesIcon} size={20} color="currentColor" strokeWidth={1.8} />
            </div>
            <p class="text-sm text-base-content/70">
              {updateInfo.description || t("update.default_desc")}
            </p>
          </div>

          <p class="text-center text-sm text-base-content/60">{t("update.only_significant")}</p>

          <Show when={updateInfo.mainFeature}>
            <Card class="border border-base-300 bg-base-200/60">
              <div class="flex items-center gap-4">
                <div class="rounded-lg bg-primary/15 p-2 text-primary">
                  {renderIcon(updateInfo.mainFeature!.icon, 18)}
                </div>
                <div class="flex-1">
                  <h2 class="text-lg font-semibold">{updateInfo.mainFeature!.title}</h2>
                  <p class="text-sm text-base-content/70">{updateInfo.mainFeature!.description}</p>
                </div>
              </div>
            </Card>
          </Show>

          <Show when={updateInfo.activationMethods && updateInfo.activationMethods.length > 0}>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-base-content/80">
                <HugeiconsIcon
                  icon={Rocket01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
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
                            class={`flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/60 px-4 py-3 text-sm ${isDisabled() ? "opacity-60" : ""}`}
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
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    }
                    title={section.title}
                  >
                    <div class="text-sm text-base-content/80" innerHTML={section.content} />
                  </Alert>
                )}
              </For>
            </div>
          </Show>

          <Show when={updateInfo.notes.length > 0}>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2 text-sm font-semibold text-base-content/80">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
                <span>{t("update.whats_new")}</span>
              </div>
              <ul class="space-y-2 text-sm text-base-content/75">
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
              <HugeiconsIcon
                icon={Settings02Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
              />
              {t("update.open_settings")}
            </Button>
            <div class="flex w-full gap-2">
              <Button
                variant="outline"
                color="secondary"
                class="flex-1 gap-2"
                onClick={openChangelog}
              >
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
                {t("update.changelog")}
              </Button>
              <Button variant="outline" class="flex-1 gap-2" onClick={openGitHub}>
                <HugeiconsIcon icon={GithubIcon} size={16} color="currentColor" strokeWidth={1.8} />
                {t("update.github")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
