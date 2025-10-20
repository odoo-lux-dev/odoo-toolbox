// Global type declarations for the Odoo Toolbox project

/**
 * Augment the global Window interface to include Odoo-specific properties
 */
declare global {
    interface Window {
        odoo?: {
            info?: {
                server_version?: string;
                server_version_info?: (string | number)[];
                db?: string;
            };
            debug?: "1" | "disabled" | "assets" | "assets,tests";
            session_info?: {
                server_version?: string;
                user_context?: Record<string, unknown> & {
                    lang?: string;
                };
                server_version_info?: (string | number)[];
                db?: string;
            };
            __DEBUG__?: {
                services?: {
                    "web.rpc"?: {
                        query: (params: {
                            model: string;
                            method: string;
                            args: unknown[];
                            kwargs: Record<string, unknown>;
                            context: Record<string, unknown>;
                        }) => Promise<unknown>;
                    };
                    "web.web_client"?: {
                        do_action: (
                            action: unknown,
                            options?: Record<string, unknown>,
                        ) => Promise<unknown>;
                    };
                    user?: {
                        context?: {
                            user_context?: Record<string, unknown>;
                        };
                    };
                    session?: {
                        user_context?: Record<string, unknown>;
                    };
                    web_client?: {
                        action_manager?: {
                            getCurrentController?: () => {
                                modelName?: string;
                                getSelectedIds?: () => number[];
                                getResId?: () => number;
                                getDomain?: () => unknown[];
                                viewType?: string;
                            };
                        };
                    };
                    version?: string;
                };
            };
            __WOWL_DEBUG__?: {
                root?: {
                    orm?: {
                        call: (
                            model: string,
                            method: string,
                            args: unknown[],
                            kwargs: Record<string, unknown>,
                        ) => Promise<unknown>;
                        env?: {
                            context?: {
                                server_version?: string;
                            };
                        };
                    };
                    user?: {
                        context?: Record<string, unknown>;
                        lang?: string;
                    };
                    localization?: {
                        code?: string;
                    };
                    actionService?: {
                        currentController?: {
                            props?: {
                                resId?: number;
                                resModel?: string;
                            };
                            view?: {
                                type?: string;
                            };
                            getLocalState?: () => {
                                resId?: number;
                                resModel?: string;
                                currentId?: number;
                                [key: string]: unknown;
                            };
                            action?: {
                                context?: Record<string, unknown>;
                                domain?: unknown[];
                                name?: string;
                                xml_id?: string;
                                type?: string;
                                [key: string]: unknown;
                            };
                            [key: string]: unknown;
                        };
                        [key: string]: unknown;
                    };
                    pos?: unknown;
                    env?: {
                        services?: {
                            action?: {
                                doAction: (
                                    action: unknown,
                                    options?: Record<string, unknown>,
                                ) => Promise<unknown>;
                            };
                            router?: {
                                current?: {
                                    model?: string;
                                    resId?: number;
                                    resIds?: number[];
                                    domain?: unknown[];
                                    view_type?: string;
                                };
                            };
                            user?: {
                                context?: Record<string, unknown>;
                            };
                            orm?: {
                                env?: {
                                    context?: {
                                        server_version?: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    }
}

export {};
