import { beforeEach, describe, expect, test } from "bun:test";

import { resetStorage } from "@@/tests/setup";

import { settingsService } from "@/services/settings-service";

import { extractBranchFromGitClone, extractTaskId } from "./branch";

describe("extractBranchFromGitClone", () => {
  test("reads the --branch / -b option", () => {
    expect(extractBranchFromGitClone("git clone --branch 17.0-12345 https://x/r.git")).toBe(
      "17.0-12345",
    );
    expect(extractBranchFromGitClone("git clone -b develop https://x/r.git")).toBe("develop");
  });

  test("returns null without a branch option", () => {
    expect(extractBranchFromGitClone("git clone https://x/r.git")).toBeNull();
  });
});

describe("extractTaskId", () => {
  beforeEach(resetStorage);

  test("returns the first capture group of the task regex", async () => {
    await settingsService.set("taskUrlRegex", "/-(\\d+)-/");
    expect(await extractTaskId("17.0-4242-fix-invoice")).toBe("4242");
  });

  test("returns null for an invalid task regex", async () => {
    await settingsService.set("taskUrlRegex", "([");
    expect(await extractTaskId("17.0-4242-fix")).toBeNull();
  });
});
