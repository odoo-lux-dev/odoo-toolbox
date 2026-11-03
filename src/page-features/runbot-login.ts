import { getConfiguredDebugModeUrl } from "@/page-features/debug-mode";
import { t } from "@/utils/i18n-page";
import { getRunbotAutoLogin, isRunbotBuildHost, isRunbotFrontendHost } from "@/utils/utils";

const AUTOLOGIN_HASH_KEY = "x-odoo-toolbox-autologin";
const CONTROLS_CLASS = "x-odoo-runbot-autologin-controls";
const MENU_CLASS = "x-odoo-runbot-autologin-menu";

const RUNBOT_USERS = {
  admin: "admin",
  demo: "demo",
  portal: "portal",
} as const;

type RunbotUser = keyof typeof RUNBOT_USERS;

const isRunbotUser = (value: string): value is RunbotUser => Object.hasOwn(RUNBOT_USERS, value);

// The fragment survives the `/runbot/run/<id>` redirect, query parameters do not.
const buildAutoLoginUrl = (href: string, user: RunbotUser): string => {
  const url = new URL(href, window.location.href);
  url.hash = `${AUTOLOGIN_HASH_KEY}=${user}`;
  return url.toString();
};

const parseHashIntent = (): RunbotUser | null => {
  const prefix = `#${AUTOLOGIN_HASH_KEY}=`;
  if (!window.location.hash.startsWith(prefix)) return null;
  const user = window.location.hash.slice(prefix.length);
  return isRunbotUser(user) ? user : null;
};

const clearHash = (): void => {
  if (!window.location.hash.startsWith(`#${AUTOLOGIN_HASH_KEY}=`)) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
};

const isRunbotSignInLink = (link: HTMLAnchorElement): boolean =>
  !link.classList.contains("dropdown-item") &&
  (link.classList.contains("fa-sign-in") || link.querySelector(".fa-sign-in") !== null);

const createAutoLoginControls = (signInLink: HTMLAnchorElement): HTMLDivElement => {
  const wrapper = document.createElement("div");
  wrapper.className = `btn-group btn-group-ssm ${CONTROLS_CLASS}`;

  signInLink.classList.add("btn-ssm");

  const adminLink = document.createElement("a");
  adminLink.className = "fa fa-user btn btn-info btn-ssm x-odoo-runbot-autologin";
  adminLink.href = buildAutoLoginUrl(signInLink.href, "admin");
  adminLink.title = t("page_features.runbot_login.login_as_admin_hint");
  adminLink.setAttribute("aria-label", adminLink.title);
  if (signInLink.target) adminLink.target = signInLink.target;
  if (signInLink.rel) adminLink.rel = signInLink.rel;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn btn-info btn-ssm dropdown-toggle";
  toggle.dataset.bsToggle = "dropdown";
  toggle.dataset.toggle = "dropdown";
  toggle.setAttribute("aria-expanded", "false");
  toggle.title = t("page_features.runbot_login.choose_user");
  toggle.setAttribute("aria-label", toggle.title);

  const caret = document.createElement("span");
  caret.className = "fa fa-caret-down";
  caret.setAttribute("aria-hidden", "true");
  toggle.appendChild(caret);

  const menu = document.createElement("ul");
  menu.className = `dropdown-menu dropdown-menu-end ${MENU_CLASS}`;

  for (const user of Object.keys(RUNBOT_USERS) as RunbotUser[]) {
    const li = document.createElement("li");
    const item = document.createElement("a");
    item.className = "dropdown-item";
    item.href = buildAutoLoginUrl(signInLink.href, user);
    item.textContent = t(`page_features.login_buttons.${user}`);
    li.appendChild(item);
    menu.appendChild(li);
  }

  signInLink.insertAdjacentElement("beforebegin", wrapper);
  wrapper.append(signInLink, adminLink, toggle, menu);
  return wrapper;
};

let updateScheduled = false;

const scheduleControlsUpdate = (): void => {
  if (updateScheduled) return;
  updateScheduled = true;
  requestAnimationFrame(() => {
    updateScheduled = false;
    addAutoLoginControls();
  });
};

const addAutoLoginControls = (): void => {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/runbot/run/"]');
  for (const link of links) {
    if (!isRunbotSignInLink(link)) continue;
    if (link.parentElement?.classList.contains(CONTROLS_CLASS)) continue;
    createAutoLoginControls(link);
  }
};

const observeRunbotBuilds = (): void => {
  new MutationObserver(scheduleControlsUpdate).observe(document.body, {
    childList: true,
    subtree: true,
  });
};

const isOdooPage = (): boolean =>
  typeof window.odoo !== "undefined" ||
  document.querySelector('form.oe_login_form, meta[name="generator"][content="Odoo"]') !== null;

const getCsrfToken = async (): Promise<string | null> => {
  const fromGlobal = (window.odoo as { csrf_token?: string } | undefined)?.csrf_token;
  if (fromGlobal) return fromGlobal;

  const fromForm = document.querySelector<HTMLInputElement>(
    'form.oe_login_form input[name="csrf_token"]',
  )?.value;
  if (fromForm) return fromForm;

  try {
    const response = await fetch("/web/login", {
      credentials: "same-origin",
      headers: { accept: "text/html" },
    });
    if (!response.ok) return null;
    const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
    return parsed.querySelector<HTMLInputElement>('input[name="csrf_token"]')?.value ?? null;
  } catch {
    return null;
  }
};

/** Authenticates without rendering the login page; Odoo replaces the session user. */
type SilentLoginResult = { success: true; url: string } | { success: false; error: string };

const failedLogin = (error?: string | null): SilentLoginResult => ({
  success: false,
  error: error || t("page_features.runbot_login.login_failed"),
});

const parseLoginError = (html: string): string | null => {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return parsed.querySelector(".alert-danger")?.textContent?.trim() || null;
};

const silentLogin = async (user: RunbotUser): Promise<SilentLoginResult> => {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return failedLogin();

  const body = new URLSearchParams({
    csrf_token: csrfToken,
    login: user,
    password: RUNBOT_USERS[user],
    type: "password",
    redirect: "/web",
  });

  try {
    const response = await fetch("/web/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (response.redirected) {
      const finalUrl = new URL(response.url);
      if (finalUrl.pathname !== "/web/login") {
        return { success: true, url: finalUrl.toString() };
      }
    }

    return failedLogin(parseLoginError(await response.text()));
  } catch {
    return failedLogin();
  }
};

const tryAutoLogin = (): boolean => {
  const user = parseHashIntent();
  if (!user || !isOdooPage()) return user !== null;

  const currentUsername = (window.odoo?.session_info as { username?: string } | undefined)
    ?.username;
  if (currentUsername === user) {
    clearHash();
    return false;
  }

  void silentLogin(user).then((result) => {
    clearHash();

    if (result.success) {
      const debugUrl = getConfiguredDebugModeUrl(new URL(result.url, window.location.href));
      window.location.href = debugUrl ?? result.url;
      return;
    }

    const loginUrl = new URL("/web/login", window.location.href);
    loginUrl.searchParams.set("error", result.error);
    const debugUrl = getConfiguredDebugModeUrl(loginUrl);
    window.location.href = debugUrl ?? loginUrl.toString();
  });

  return true;
};

const handleRunbotAutoLogin = (): boolean => {
  if (getRunbotAutoLogin() !== "true") {
    if (isRunbotBuildHost(window.location.hostname)) clearHash();
    return false;
  }

  if (isRunbotFrontendHost(window.location.hostname)) {
    addAutoLoginControls();
    observeRunbotBuilds();
  }

  if (isRunbotBuildHost(window.location.hostname)) return tryAutoLogin();

  return false;
};

export {
  addAutoLoginControls,
  buildAutoLoginUrl,
  handleRunbotAutoLogin,
  isRunbotBuildHost,
  isRunbotFrontendHost,
};
