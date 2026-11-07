import { Match, Switch, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { hasHostPermission, isSupportedSignal } from "@/screens/devtools/environment";
import { DevToolsLayout } from "@/screens/devtools/Layout";
import { currentTab, type TabId } from "@/screens/devtools/router";
import { CallMethodTab } from "@/screens/devtools/tabs/call-method-tab";
import { CreateTab } from "@/screens/devtools/tabs/create-tab";
import { HistoryTab } from "@/screens/devtools/tabs/history-tab";
import { SearchTab } from "@/screens/devtools/tabs/search-tab";
import { UnlinkTab } from "@/screens/devtools/tabs/unlink-tab";
import { WriteTab } from "@/screens/devtools/tabs/write-tab";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";

const TAB_COMPONENTS: Record<TabId, Component> = {
  search: SearchTab,
  write: WriteTab,
  create: CreateTab,
  "call-method": CallMethodTab,
  unlink: UnlinkTab,
  history: HistoryTab,
};

/** Full screen state shown instead of the tabs (permission, detection, unreachable). */
const Notice = (props: {
  title: string;
  color: "warning" | "info" | "error";
  actions?: JSX.Element;
  children: JSX.Element;
}) => (
  <div class="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
    <Alert
      title={props.title}
      color={props.color}
      variant="soft"
      class="flex w-full max-w-2xl flex-col items-start"
      actions={props.actions}
    >
      {props.children}
    </Alert>
  </div>
);

export const DevToolsContent = () => {
  const reload = () => window.location.reload();

  const handlePermissionsAsking = async () => {
    await odooRpcService.requestHostPermission();
    reload();
  };

  return (
    <Switch
      fallback={
        <DevToolsLayout>
          <Dynamic component={TAB_COMPONENTS[currentTab().id]} />
        </DevToolsLayout>
      }
    >
      <Match when={hasHostPermission() === false}>
        <Notice
          title={t("devtools.content.insufficient_permissions")}
          color="warning"
          actions={
            <Button
              variant="outline"
              color="warning"
              onClick={handlePermissionsAsking}
              class="ms-auto"
            >
              {t("devtools.content.grant_permission")}
            </Button>
          }
        >
          <p class="text-sm text-ink-2">{t("devtools.content.insufficient_permissions_desc")}</p>
        </Notice>
      </Match>

      <Match when={isSupportedSignal() === null}>
        <Notice title={t("devtools.content.detecting")} color="info">
          <div class="flex items-center gap-3 text-ink-2">
            <span class="loading loading-md loading-spinner" />
            <span>{t("devtools.content.detecting_desc")}</span>
          </div>
        </Notice>
      </Match>

      <Match when={isSupportedSignal() === false}>
        <Notice
          title={t("devtools.content.unable_to_reach")}
          color="error"
          actions={
            <Button variant="outline" color="error" onClick={reload}>
              {t("common.retry")}
            </Button>
          }
        >
          <div class="text-sm text-ink-2">
            <p>{t("devtools.content.valid_context_hint")}</p>
            <ul class="mt-2 list-disc space-y-1 ps-5">
              <li>{t("devtools.content.on_odoo_instance")}</li>
              <li>{t("devtools.content.inside_backend")}</li>
            </ul>
          </div>
        </Notice>
      </Match>
    </Switch>
  );
};
