import { describe, expect, test } from "vitest";

import { isLocalHost } from "@/utils/odoo-hosts";

const hostnameOf = (url: string) => new URL(url).hostname;

describe("isLocalHost", () => {
  test.each([
    "http://localhost:8069",
    "http://odoo.localhost:8069",
    "http://127.0.0.1:8069",
    "http://0.0.0.0:8069",
    "http://[::1]:8069",
    "http://10.0.0.5:8069",
    "http://192.168.1.20:8069",
    "http://172.16.0.1:8069",
    "http://169.254.1.1:8069",
  ])("recognises %s", (url) => {
    expect(isLocalHost(hostnameOf(url))).toBe(true);
  });

  test.each([
    "https://www.odoo.com",
    "https://runbot.odoo.com",
    "http://172.32.0.1",
    "http://[2001:db8::1]",
    "https://localhost.example.com",
  ])("rejects %s", (url) => {
    expect(isLocalHost(hostnameOf(url))).toBe(false);
  });
});
