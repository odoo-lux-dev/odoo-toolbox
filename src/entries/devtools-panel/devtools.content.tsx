import { Route, Router } from "preact-router";
import { useSupportCheck } from "@/contexts/devtools-signals-hook";
import { DevToolsLayout } from "@/entries/devtools-panel/devtools.layout";
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
                <div className="unsupported-message">
                    <h3>Insufficient Permissions</h3>
                    <div className="unsupported-details">
                        <p>
                            To access the Odoo Toolbox Devtools, you need to
                            grant host permission for this domain.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary-outline retry-btn"
                        onClick={handlePermissionsAsking}
                    >
                        Grant permission
                    </button>
                </div>
            </div>
        );
    }

    if (isSupported === null) {
        return (
            <div className="devtools-app loading">
                <div className="loading-message">
                    <div className="spinner"></div>
                    <span>Detecting Odoo version...</span>
                </div>
            </div>
        );
    }

    // If Odoo is not supported, show only error message
    if (isSupported === false) {
        return (
            <div className="devtools-app unsupported">
                <div className="unsupported-message">
                    <h3>Unable to reach Odoo</h3>
                    <div className="unsupported-details">
                        <p>Be sure that you are in a valid context :</p>
                        <ul>
                            <li>You're on an Odoo instance</li>
                            <li>
                                You're inside the Odoo's backend (and not on the
                                website)
                            </li>
                        </ul>
                    </div>
                    <button
                        className="btn btn-primary-outline retry-btn"
                        onClick={handleRetry}
                    >
                        Retry
                    </button>
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
                    <DevToolsLayout currentPath="/search">
                        <SearchTab />
                    </DevToolsLayout>
                )}
            />
        </Router>
    );
};
