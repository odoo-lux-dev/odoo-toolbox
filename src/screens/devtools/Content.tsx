import { Switch, Match } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { hasHostPermission, isSupportedSignal } from "@/screens/devtools/devtools-signals";
import { DevToolsLayout, route } from "@/screens/devtools/Layout";
import { CallMethodTab } from "@/screens/devtools/tabs/call-method-tab";
import { CreateTab } from "@/screens/devtools/tabs/create-tab";
import { HistoryTab } from "@/screens/devtools/tabs/history-tab";
import { SearchTab } from "@/screens/devtools/tabs/search-tab";
import { UnlinkTab } from "@/screens/devtools/tabs/unlink-tab";
import { WriteTab } from "@/screens/devtools/tabs/write-tab";
import { t } from "@/services/i18n-service";
import { odooRpcService } from "@/services/odoo-rpc-service";

export const DevToolsContent = () => {
  const isSupported = isSupportedSignal;

  const handleRetry = () => {
    window.location.reload();
  };

  const handlePermissionsAsking = async () => {
    await odooRpcService.requestHostPermission();
    window.location.reload();
  };

  return (
    <Switch>
      <Match when={hasHostPermission() === false}>
        <div class="devtools-app unsupported">
          <div class="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
            <Alert
              title={t("devtools.content.insufficient_permissions")}
              color="warning"
              variant="soft"
              class="flex w-full max-w-2xl flex-col items-start"
              actions={
                <Button
                  variant="outline"
                  color="warning"
                  onClick={handlePermissionsAsking}
                  class="ml-auto"
                >
                  {t("devtools.content.grant_permission")}
                </Button>
              }
            >
              <p class="text-sm text-base-content/80">
                {t("devtools.content.insufficient_permissions_desc")}
              </p>
            </Alert>
          </div>
        </div>
      </Match>

      <Match when={isSupported() === null}>
        <div class="devtools-app detecting">
          <div class="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
            <Alert
              title={t("devtools.content.detecting")}
              color="info"
              variant="soft"
              class="flex w-full max-w-2xl flex-col items-start"
            >
              <div class="flex items-center gap-3 text-base-content/80">
                <span class="loading loading-md loading-spinner" />
                <span>{t("devtools.content.detecting_desc")}</span>
              </div>
            </Alert>
          </div>
        </div>
      </Match>

      <Match when={isSupported() === false}>
        <div class="devtools-app unsupported">
          <div class="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
            <Alert
              title={t("devtools.content.unable_to_reach")}
              color="error"
              variant="soft"
              class="flex w-full max-w-2xl flex-col items-start"
              actions={
                <Button variant="outline" color="error" onClick={handleRetry}>
                  {t("common.retry")}
                </Button>
              }
            >
              <div class="text-sm text-base-content/80">
                <p>{t("devtools.content.valid_context_hint")}</p>
                <ul class="mt-2 list-disc space-y-1 ps-5">
                  <li>{t("devtools.content.on_odoo_instance")}</li>
                  <li>{t("devtools.content.inside_backend")}</li>
                </ul>
              </div>
            </Alert>
          </div>
        </div>
      </Match>

      <Match when={true}>
        <Switch>
          <Match when={route() === "/search"}>
            <DevToolsLayout currentPath="/search">
              <SearchTab />
            </DevToolsLayout>
          </Match>
          <Match when={route() === "/write"}>
            <DevToolsLayout currentPath="/write">
              <WriteTab />
            </DevToolsLayout>
          </Match>
          <Match when={route() === "/create"}>
            <DevToolsLayout currentPath="/create">
              <CreateTab />
            </DevToolsLayout>
          </Match>
          <Match when={route() === "/call-method"}>
            <DevToolsLayout currentPath="/call-method">
              <CallMethodTab />
            </DevToolsLayout>
          </Match>
          <Match when={route() === "/unlink"}>
            <DevToolsLayout currentPath="/unlink">
              <UnlinkTab />
            </DevToolsLayout>
          </Match>
          <Match when={route() === "/history"}>
            <DevToolsLayout currentPath="/history">
              <HistoryTab />
            </DevToolsLayout>
          </Match>
          <Match when={true}>
            <DevToolsLayout currentPath="/search">
              <SearchTab />
            </DevToolsLayout>
          </Match>
        </Switch>
      </Match>
    </Switch>
  );
};
