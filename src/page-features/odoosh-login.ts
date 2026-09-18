import { t } from "@/utils/i18n-page";
import { getShowOdooShLoginButton, isOdooShHosted } from "@/utils/utils";

const createOdooShLoginButton = (): HTMLAnchorElement => {
  const btn = document.createElement("a");
  btn.href = `${window.location.origin}/_odoo/paas/connect`;
  btn.className = "btn btn-outline-primary x-odoosh-login-button";
  btn.title = t("page_features.odoosh_login.login_hint");
  btn.textContent = t("page_features.odoosh_login.login");
  return btn;
};

/**
 * Adds the "Log in with Odoo.sh" button on the Odoo login page, right below the
 * standard "Log in" button inside the `.oe_login_buttons` container.
 */
const handleOdooShLoginButton = async (): Promise<void> => {
  const showOdooShLoginButton = getShowOdooShLoginButton() === "true";
  const loginForm = document.querySelector("form.oe_login_form");

  if (!showOdooShLoginButton || !loginForm || loginForm.querySelector(".x-odoosh-login-button"))
    return;

  if (!(await isOdooShHosted())) return;

  const btn = createOdooShLoginButton();

  const oeLoginButtons = loginForm.querySelector<HTMLElement>(".oe_login_buttons");
  if (oeLoginButtons) {
    btn.classList.add("mt-2");
    const submitButton = oeLoginButtons.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.insertAdjacentElement("afterend", btn);
    } else {
      oeLoginButtons.insertBefore(btn, oeLoginButtons.firstChild);
    }
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "form-group mb-3 text-center";
  wrapper.appendChild(btn);

  const submitContainer = loginForm.querySelector(".field-login");
  if (submitContainer) {
    loginForm.insertBefore(wrapper, submitContainer);
  } else {
    loginForm.appendChild(wrapper);
  }
};

export { handleOdooShLoginButton };
