import { resolveLocale, type SupportedLocale } from "@/services/i18n-locales";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import type { DebugPathIgnoreScope, IgnoredDebugPath } from "@/types";

const CONTEXT_MENU_ID = "ot-ignore-debug";
const CONTEXT_MENU_IDS: Record<DebugPathIgnoreScope, string> = {
  domain: "ot-ignore-debug-domain",
  path: "ot-ignore-debug-path",
  domain_path: "ot-ignore-debug-domain-path",
};

type ContextMenuMessages = Record<"parent" | "domain" | "path" | "domain_path", string>;

const MESSAGE_KEYS = [
  "browser_context_menu_parent",
  "browser_context_menu_domain",
  "browser_context_menu_path",
  "browser_context_menu_domain_path",
] as const;

const DEFAULT_MESSAGES: ContextMenuMessages = {
  parent: "Odoo Toolbox",
  domain: "Ignore debug mode on this domain",
  path: "Ignore debug mode on this path (all domains)",
  domain_path: "Ignore debug mode on this path (this domain)",
};

// Reads the context menu titles from the extension's generated `_locales` files for
// the user's configured locale without bundling every translation file into the background
const getContextMenuMessages = async (locale: SupportedLocale): Promise<ContextMenuMessages> => {
  try {
    const response = await fetch(
      browser.runtime.getURL(`_locales/${locale}/messages.json` as never),
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`Failed to load messages for locale "${locale}"`);
    const messages = (await response.json()) as Record<string, { message?: string }>;

    const result: ContextMenuMessages = { ...DEFAULT_MESSAGES };
    for (const key of MESSAGE_KEYS) {
      const value = messages[key]?.message;
      if (value) {
        const target = key.slice("browser_context_menu_".length);
        result[target as keyof ContextMenuMessages] = value;
      }
    }
    return result;
  } catch (error) {
    Logger.error("Failed to fetch context menu messages, falling back to native i18n", error);
    return {
      parent:
        browser.i18n.getMessage("browser_context_menu_parent" as never) || DEFAULT_MESSAGES.parent,
      domain:
        browser.i18n.getMessage("browser_context_menu_domain" as never) || DEFAULT_MESSAGES.domain,
      path: browser.i18n.getMessage("browser_context_menu_path" as never) || DEFAULT_MESSAGES.path,
      domain_path:
        browser.i18n.getMessage("browser_context_menu_domain_path" as never) ||
        DEFAULT_MESSAGES.domain_path,
    };
  }
};

const setupContextMenu = (messages: ContextMenuMessages): void => {
  browser.contextMenus
    .removeAll()
    .then(() => {
      browser.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: messages.parent,
        contexts: ["page"],
      });

      browser.contextMenus.create({
        id: CONTEXT_MENU_IDS.domain,
        parentId: CONTEXT_MENU_ID,
        title: messages.domain,
        contexts: ["page"],
      });

      browser.contextMenus.create({
        id: CONTEXT_MENU_IDS.path,
        parentId: CONTEXT_MENU_ID,
        title: messages.path,
        contexts: ["page"],
      });

      browser.contextMenus.create({
        id: CONTEXT_MENU_IDS.domain_path,
        parentId: CONTEXT_MENU_ID,
        title: messages.domain_path,
        contexts: ["page"],
      });
    })
    .catch((error: unknown) => Logger.error("Failed to create context menu", error));
};

const createIgnoredDebugPath = (scope: DebugPathIgnoreScope, url: URL) => {
  const { hostname, pathname } = url;

  const pathData = {
    domain: { domain: hostname },
    path: { path: pathname },
    domain_path: { domain: hostname, path: pathname },
  };

  return { scope, deletable: true, ...pathData[scope] } as IgnoredDebugPath;
};

const handleContextMenuClick = (scope: DebugPathIgnoreScope, url?: string): void => {
  if (!url) return;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return;
  }

  const entry = createIgnoredDebugPath(scope, parsedUrl);

  settingsService
    .addIgnoredDebugPath(entry)
    .catch((error: unknown) => Logger.error("Failed to ignore debug path", error));
};

let lastLocale: SupportedLocale | null = null;

const refreshContextMenu = async (): Promise<void> => {
  const locale = await resolveLocale();
  if (locale === lastLocale) return;
  lastLocale = locale;
  const messages = await getContextMenuMessages(locale);
  setupContextMenu(messages);
};

export const registerContextMenuHandlers = (): void => {
  browser.contextMenus.onClicked.addListener((info, tab) => {
    const scope = (Object.keys(CONTEXT_MENU_IDS) as DebugPathIgnoreScope[]).find(
      (key) => CONTEXT_MENU_IDS[key] === info.menuItemId,
    );
    if (!scope) return;

    const url = info.pageUrl ?? tab?.url;
    handleContextMenuClick(scope, url);
  });

  void refreshContextMenu();

  settingsService.watchSettings(() => {
    void refreshContextMenu();
  });
};

export { CONTEXT_MENU_ID, CONTEXT_MENU_IDS };
