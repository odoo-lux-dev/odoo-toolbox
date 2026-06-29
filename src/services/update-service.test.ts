import { describe, expect, test } from "bun:test";

import { updateService } from "@/services/update-service";

describe("UpdateService", () => {
  describe("shouldShowUpdatePage", () => {
    test("should return true when a major update falls within the version range", () => {
      expect(updateService.shouldShowUpdatePage("1.6.0", "1.5.0")).toBe(true);
      expect(updateService.shouldShowUpdatePage("1.8.0", "1.7.0")).toBe(true);
    });

    test("should return false when no major update in range", () => {
      expect(updateService.shouldShowUpdatePage("1.5.0", "1.5.0")).toBe(false);
      expect(updateService.shouldShowUpdatePage("1.4.0", "1.3.0")).toBe(false);
    });

    test("should return false when current version is before all updates", () => {
      expect(updateService.shouldShowUpdatePage("1.0.0", "1.0.0")).toBe(false);
    });

    test("should handle multiple updates in range", () => {
      expect(updateService.shouldShowUpdatePage("1.8.0", "1.4.0")).toBe(true);
    });

    test("should return false when previous > current", () => {
      expect(updateService.shouldShowUpdatePage("1.5.0", "1.6.0")).toBe(false);
    });
  });

  describe("getUpdateInfo", () => {
    test("should return info for the most recent eligible update", () => {
      const info = updateService.getUpdateInfo("1.8.0");
      expect(info.updateVersion).toBe("1.8.0");
      expect(info.notes.length).toBeGreaterThan(0);
    });

    test("should return info for 1.6.0 when current is 1.6.0", () => {
      const info = updateService.getUpdateInfo("1.6.0");
      expect(info.updateVersion).toBe("1.6.0");
    });

    test("should return empty notes for version before all updates", () => {
      const info = updateService.getUpdateInfo("1.0.0");
      expect(info.notes).toEqual([]);
    });

    test("should include mainFeature when available", () => {
      const info = updateService.getUpdateInfo("1.8.0");
      expect(info.mainFeature).toBeDefined();
      expect(info.mainFeature?.title).toBeDefined();
    });

    test("should include activationMethods when available", () => {
      const info = updateService.getUpdateInfo("1.8.0");
      expect(info.activationMethods).toBeDefined();
      expect(info.activationMethods?.length).toBeGreaterThan(0);
    });

    test("should include customSections when available", () => {
      const info = updateService.getUpdateInfo("1.8.0");
      expect(info.customSections).toBeDefined();
      expect(info.customSections?.length).toBeGreaterThan(0);
    });
  });

  describe("getAllMajorUpdates", () => {
    test("should return all major updates", () => {
      const updates = updateService.getAllMajorUpdates();
      expect(updates.length).toBeGreaterThanOrEqual(3);
    });

    test("should include version 1.8.0", () => {
      const updates = updateService.getAllMajorUpdates();
      expect(updates.some((u) => u.version === "1.8.0")).toBe(true);
    });
  });

  describe("getUpdatesInRange", () => {
    test("should return updates within the range", () => {
      const updates = updateService.getUpdatesInRange("1.4.0", "1.8.0");
      expect(updates.length).toBeGreaterThanOrEqual(2);
      expect(updates.some((u) => u.version === "1.5.0")).toBe(true);
      expect(updates.some((u) => u.version === "1.6.0")).toBe(true);
    });

    test("should return empty for range with no updates", () => {
      const updates = updateService.getUpdatesInRange("1.0.0", "1.4.0");
      expect(updates).toEqual([]);
    });
  });

  describe("shouldVersionShowUpdatePage", () => {
    test("should return true for versions with shouldShowUpdatePage", () => {
      expect(updateService.shouldVersionShowUpdatePage("1.8.0")).toBe(true);
      expect(updateService.shouldVersionShowUpdatePage("1.6.0")).toBe(true);
      expect(updateService.shouldVersionShowUpdatePage("1.5.0")).toBe(true);
    });

    test("should return false for unknown versions", () => {
      expect(updateService.shouldVersionShowUpdatePage("99.0.0")).toBe(false);
    });
  });

  describe("version comparison (indirect)", () => {
    test("should handle semver with different lengths", () => {
      expect(updateService.shouldShowUpdatePage("1.6.0", "1.5")).toBe(true);
    });

    test("should handle equal versions", () => {
      expect(updateService.shouldShowUpdatePage("1.6.0", "1.6.0")).toBe(false);
    });
  });
});
