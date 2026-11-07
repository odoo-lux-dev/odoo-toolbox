/** Demo users of Odoo test databases (runbot, `--load-demo`): the password is the login. */
export const DEMO_USERS = ["admin", "demo", "portal"] as const;

export type DemoUser = (typeof DEMO_USERS)[number];

export const isDemoUser = (value: string): value is DemoUser =>
  (DEMO_USERS as readonly string[]).includes(value);

export const getLoginForm = () => document.querySelector<HTMLFormElement>("form.oe_login_form");

/** Inserts a block above the login field of the Odoo login form. */
export const insertInLoginForm = (loginForm: HTMLFormElement, block: HTMLElement): void => {
  const loginField = loginForm.querySelector(".field-login");
  if (loginField) loginForm.insertBefore(block, loginField);
  else loginForm.appendChild(block);
};
