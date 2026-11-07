import { beforeEach, describe, expect, test } from "bun:test";

import { isRunbotBuildHost, isRunbotFrontendHost } from "@/utils/odoo-hosts";

import { addAutoLoginControls, buildAutoLoginUrl } from "./runbot-login";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("isRunbotFrontendHost", () => {
  test("matches the Runbot frontend hosts", () => {
    expect(isRunbotFrontendHost("runbot.odoo.com")).toBe(true);
    expect(isRunbotFrontendHost("www.runbot.odoo.com")).toBe(true);
    expect(isRunbotFrontendHost("runbot320.odoo.com")).toBe(true);
  });

  test("rejects unrelated hosts", () => {
    expect(isRunbotFrontendHost("www.odoo.com")).toBe(false);
    expect(isRunbotFrontendHost("runbot.odoo.com.evil.com")).toBe(false);
    expect(isRunbotFrontendHost("131141510-saas-19-4.runbot320.odoo.com")).toBe(false);
  });
});

describe("isRunbotBuildHost", () => {
  test("matches build instances", () => {
    expect(isRunbotBuildHost("131141510-saas-19-4.runbot320.odoo.com")).toBe(true);
    expect(isRunbotBuildHost("build.runbot.odoo.com")).toBe(true);
  });

  test("rejects Runbot frontend hosts", () => {
    expect(isRunbotBuildHost("runbot.odoo.com")).toBe(false);
    expect(isRunbotBuildHost("runbot320.odoo.com")).toBe(false);
    expect(isRunbotBuildHost("www.runbot.odoo.com")).toBe(false);
    expect(isRunbotBuildHost("www.odoo.com")).toBe(false);
  });
});

describe("buildAutoLoginUrl", () => {
  test("adds the selected user to a relative URL", () => {
    expect(buildAutoLoginUrl("/runbot/run/131128639", "admin")).toBe(
      "http://localhost/runbot/run/131128639#x-odoo-toolbox-autologin=admin",
    );
  });

  test("preserves an existing query string", () => {
    expect(buildAutoLoginUrl("https://runbot.odoo.com/runbot/run/123?foo=bar", "demo")).toBe(
      "https://runbot.odoo.com/runbot/run/123?foo=bar#x-odoo-toolbox-autologin=demo",
    );
  });
});

describe("addAutoLoginControls", () => {
  test("groups the classic login, a one-click admin button and a user menu", () => {
    document.body.innerHTML =
      '<a class="fa fa-sign-in btn btn-info" href="/runbot/run/131128639"></a>';

    addAutoLoginControls();

    const signInLink = document.querySelector<HTMLAnchorElement>("a.fa-sign-in");
    const controls = signInLink?.parentElement;
    const adminLink = controls?.querySelector<HTMLAnchorElement>(".x-odoo-runbot-autologin");
    const toggle = controls?.querySelector<HTMLButtonElement>("button.dropdown-toggle");
    const menuLinks = controls?.querySelectorAll<HTMLAnchorElement>(
      ".x-odoo-runbot-autologin-menu .dropdown-item",
    );

    expect(controls?.classList.contains("x-odoo-runbot-autologin-controls")).toBe(true);
    expect(controls?.classList.contains("btn-group-ssm")).toBe(true);
    expect(controls?.firstElementChild).toBe(signInLink);
    expect(signInLink?.classList.contains("btn-ssm")).toBe(true);
    expect(adminLink?.classList.contains("btn-ssm")).toBe(true);
    expect(adminLink?.getAttribute("href")).toBe(
      "http://localhost/runbot/run/131128639#x-odoo-toolbox-autologin=admin",
    );
    expect(toggle?.classList.contains("btn-ssm")).toBe(true);
    expect(toggle?.querySelector(".fa-caret-down")).not.toBeNull();
    expect(toggle?.dataset.bsToggle).toBe("dropdown");
    expect([...menuLinks!].map((item) => item.getAttribute("href"))).toEqual([
      "http://localhost/runbot/run/131128639#x-odoo-toolbox-autologin=admin",
      "http://localhost/runbot/run/131128639#x-odoo-toolbox-autologin=demo",
      "http://localhost/runbot/run/131128639#x-odoo-toolbox-autologin=portal",
    ]);
  });

  test("does not insert the controls twice", () => {
    document.body.innerHTML =
      '<a class="fa fa-sign-in btn btn-info" href="/runbot/run/131128639"></a>';

    addAutoLoginControls();
    addAutoLoginControls();

    expect(document.querySelectorAll(".x-odoo-runbot-autologin-controls")).toHaveLength(1);
  });

  test("ignores dropdown menu entries", () => {
    document.body.innerHTML =
      '<a class="dropdown-item" href="/runbot/run/131128639"><i class="fa fa-sign-in"></i></a>';

    addAutoLoginControls();

    expect(document.querySelectorAll(".x-odoo-runbot-autologin-controls")).toHaveLength(0);
  });

  test("supports the icon-inside-anchor layout", () => {
    document.body.innerHTML =
      '<a class="btn btn-info" href="/runbot/run/131128639"><i class="fa fa-sign-in"></i></a>';

    addAutoLoginControls();

    expect(document.querySelectorAll(".x-odoo-runbot-autologin-controls")).toHaveLength(1);
  });
});
