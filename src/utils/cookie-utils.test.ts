import { beforeEach, describe, expect, test } from "bun:test";

import { getCookie, removeCookie, setCookie } from "./cookie-utils";

const clearCookies = () => {
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (name) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
};

beforeEach(() => {
  clearCookies();
});

describe("getCookie", () => {
  test("returns null when the cookie is missing", () => {
    expect(getCookie("missing")).toBeNull();
  });

  test("does not match a cookie whose name has the same prefix", () => {
    document.cookie = "color_scheme_extra=dark";

    expect(getCookie("color_scheme")).toBeNull();
  });

  test("decodes the cookie value", () => {
    document.cookie = "name=hello%20world";

    expect(getCookie("name")).toBe("hello world");
  });
});

describe("setCookie", () => {
  test("writes a cookie readable from the same path", () => {
    setCookie("color_scheme", "dark");

    expect(getCookie("color_scheme")).toBe("dark");
  });

  test("encodes the cookie value", () => {
    setCookie("name", "hello world");

    expect(getCookie("name")).toBe("hello world");
  });
});

describe("removeCookie", () => {
  test("clears the cookie value", () => {
    setCookie("color_scheme", "dark");
    removeCookie("color_scheme");

    expect(document.cookie).not.toContain("color_scheme=dark");
  });
});
