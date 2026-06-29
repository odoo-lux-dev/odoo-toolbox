import { t } from "@/utils/i18n-page";
import { getShowLoginButtons } from "@/utils/utils";

/**
 * Returns true when the current site should not show login buttons.
 */
const isLoginButtonsBlacklisted = (): boolean => {
  const { hostname, pathname } = window.location;

  if (hostname === "runbot.odoo.com") {
    return true;
  }

  if (pathname.startsWith("/_odoo/support")) {
    return true;
  }

  return false;
};

/**
 * Fills the login form credentials and attempts to submit the form.
 */
const fillCredentialsAndSubmit = (username: string, password: string): void => {
  const loginInput = document.querySelector('input[name="login"]') as HTMLInputElement;
  const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
  const form = document.querySelector("form.oe_login_form") as HTMLFormElement;

  if (loginInput && passwordInput) {
    loginInput.value = username;
    passwordInput.value = password;

    if (form) {
      form.submit();
    } else {
      const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn?.click();
    }
  }
};

/**
 * Creates a single login button anchor element.
 */
const createLoginButton = (label: string, user: string, pass: string): HTMLAnchorElement => {
  const btn = document.createElement("a");
  btn.href = "#";
  btn.className = "btn btn-outline-primary";
  btn.dataset.username = user;
  btn.dataset.password = pass;
  btn.title = t("page_features.login_buttons.login_as_user", [label]);
  btn.textContent = label;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    fillCredentialsAndSubmit(user, pass);
  });

  return btn;
};

/**
 * Finds the Odoo login form and injects the "Login as" button group.
 * It searches for 'form.oe_login_form' automatically.
 */
const handleLoginButtons = (): void => {
  const showLoginButtons = getShowLoginButtons() === "true";
  const loginForm = document.querySelector("form.oe_login_form");

  if (
    !showLoginButtons ||
    isLoginButtonsBlacklisted() ||
    !loginForm ||
    loginForm.querySelector(".x-odoo-login-buttons")
  )
    return;

  const wrapper = document.createElement("div");
  wrapper.className = "form-group mb-3 text-center x-odoo-login-buttons";

  const labelSpan = document.createElement("div");
  labelSpan.className = "small mb-1";
  labelSpan.textContent = t("page_features.login_buttons.login_as");
  wrapper.appendChild(labelSpan);

  const btnGroup = document.createElement("div");
  btnGroup.className = "btn-group btn-group-sm";

  const adminBtn = createLoginButton(t("page_features.login_buttons.admin"), "admin", "admin");
  const demoBtn = createLoginButton(t("page_features.login_buttons.demo"), "demo", "demo");
  const portalBtn = createLoginButton(t("page_features.login_buttons.portal"), "portal", "portal");

  btnGroup.append(adminBtn, demoBtn, portalBtn);
  wrapper.appendChild(btnGroup);

  const submitContainer = loginForm.querySelector(".field-login");
  if (submitContainer) {
    loginForm.insertBefore(wrapper, submitContainer);
  } else {
    loginForm.appendChild(wrapper);
  }
};

export { handleLoginButtons };
