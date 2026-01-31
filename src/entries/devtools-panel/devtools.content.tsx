import { Route, Router } from "preact-router";
import { useSupportCheck } from "@/contexts/devtools-signals-hook";
import { DevToolsLayout } from "@/entries/devtools-panel/devtools.layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CallMethodTab } from "@/entries/devtools-panel/tabs/call-method-tab";
import { CreateTab } from "@/entries/devtools-panel/tabs/create-tab";
import { HistoryTab } from "@/entries/devtools-panel/tabs/history-tab";
import { SearchTab } from "@/entries/devtools-panel/tabs/search-tab";
import { UnlinkTab } from "@/entries/devtools-panel/tabs/unlink-tab";
import { WriteTab } from "@/entries/devtools-panel/tabs/write-tab";
import { odooRpcService } from "@/services/odoo-rpc-service";

interface DevToolsPageProps {
    path?: string;
}

// Main DevTools content with router
export const DevToolsContent = () => {
    const { isSupported, hasHostPermission } = useSupportCheck();

    const handleRetry = () => {
        window.location.reload();
    };

    const handlePermissionsAsking = async () => {
        await odooRpcService.requestHostPermission();
        window.location.reload();
    };

    if (hasHostPermission == false) {
        return (
            <div className="devtools-app unsupported">
                <div className="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
                    <Alert
                        title="Insufficient Permissions"
                        color="warning"
                        variant="soft"
                        className="flex w-full max-w-2xl flex-col items-start"
                        actions={
                            <Button
                                variant="outline"
                                color="warning"
                                onClick={handlePermissionsAsking}
                                className="ml-auto"
                            >
                                Grant permission
                            </Button>
                        }
                    >
                        <p className="text-sm text-base-content/80">
                            To access the Odoo Toolbox Devtools, you need to
                            grant host permission for this domain.
                        </p>
                    </Alert>
                </div>
            </div>
        );
    }

    if (isSupported === null) {
        return (
            <div className="devtools-app detecting">
                <div className="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
                    <Alert
                        title="Detecting Odoo version..."
                        color="info"
                        variant="soft"
                        className="flex w-full max-w-2xl flex-col items-start"
                    >
                        <div className="flex items-center gap-3 text-base-content/80">
                            <span className="loading loading-md loading-spinner" />
                            <span>
                                Checking your current Odoo instance. This should
                                only take a moment.
                            </span>
                        </div>
                    </Alert>
                </div>
            </div>
        );
    }

    // If Odoo is not supported, show only error message
    if (isSupported === false) {
        return (
            <div className="devtools-app unsupported">
                <div className="flex min-h-screen items-center justify-center bg-base-100 px-6 py-10">
                    <Alert
                        title="Unable to reach Odoo"
                        color="error"
                        variant="soft"
                        className="flex w-full max-w-2xl flex-col items-start"
                        actions={
                            <Button
                                variant="outline"
                                color="error"
                                onClick={handleRetry}
                            >
                                Retry
                            </Button>
                        }
                    >
                        <div className="text-sm text-base-content/80">
                            <p>Be sure that you are in a valid context :</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                <li>You're on an Odoo instance</li>
                                <li>
                                    You're inside the Odoo's backend (and not on
                                    the website)
                                </li>
                            </ul>
                        </div>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Route
                path="/search"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/search"}>
                        <SearchTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                path="/write"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/write"}>
                        <WriteTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                path="/create"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/create"}>
                        <CreateTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                path="/call-method"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/call-method"}>
                        <CallMethodTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                path="/unlink"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/unlink"}>
                        <UnlinkTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                path="/history"
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/history"}>
                        <HistoryTab />
                    </DevToolsLayout>
                )}
            />
            <Route
                default
                component={({ path }: DevToolsPageProps) => (
                    <DevToolsLayout currentPath={path || "/search"}>
                        <SearchTab />
                    </DevToolsLayout>
                )}
            />
        </Router>
    );
};
