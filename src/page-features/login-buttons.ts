import { t } from "@/utils/i18n-page";
import { isRunbotFrontendHost } from "@/utils/odoo-hosts";
import { readDatasetSetting } from "@/utils/settings-schema";

import { DEMO_USERS, getLoginForm, insertInLoginForm } from "./login-form";

const isLoginButtonsBlacklisted = (): boolean =>
  isRunbotFrontendHost(window.location.hostname) ||
  window.location.pathname.startsWith("/_odoo/support");

const fillCredentialsAndSubmit = (loginForm: HTMLFormElement, user: string): void => {
  const loginInput = loginForm.querySelector<HTMLInputElement>('input[name="login"]');
  const passwordInput = loginForm.querySelector<HTMLInputElement>('input[name="password"]');
  if (!loginInput || !passwordInput) return;
  loginInput.value = user;
  passwordInput.value = user;
  loginForm.submit();
};

/** Adds "Log in as admin / demo / portal" buttons to the Odoo login form. */
const handleLoginButtons = (): void => {
  const loginForm = getLoginForm();
  if (
    !readDatasetSetting("showLoginButtons") ||
    isLoginButtonsBlacklisted() ||
    !loginForm ||
    loginForm.querySelector(".x-odoo-login-buttons")
  )
    return;

  const wrapper = document.createElement("div");
  wrapper.className = "form-group mb-3 text-center x-odoo-login-buttons";

  const label = document.createElement("div");
  label.className = "small mb-1";
  label.textContent = t("page_features.login_buttons.login_as");

  const btnGroup = document.createElement("div");
  btnGroup.className = "btn-group btn-group-sm";
  for (const user of DEMO_USERS) {
    const userLabel = t(`page_features.login_buttons.${user}`);
    const btn = document.createElement("a");
    btn.href = "#";
    btn.className = "btn btn-outline-primary";
    btn.title = t("page_features.login_buttons.login_as_user", [userLabel]);
    btn.textContent = userLabel;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      fillCredentialsAndSubmit(loginForm, user);
    });
    btnGroup.appendChild(btn);
  }

  wrapper.append(label, btnGroup);
  insertInLoginForm(loginForm, wrapper);
};

export { handleLoginButtons };
