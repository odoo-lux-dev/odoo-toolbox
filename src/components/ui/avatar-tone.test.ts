import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AVATAR_TONE_COUNT, avatarTone, initials } from "./avatar-tone";

const tones = Array.from({ length: AVATAR_TONE_COUNT }, (_, index) => index + 1);

describe("avatarTone", () => {
  test("stays within the palette and uses all of it", () => {
    const used = new Set(Array.from({ length: 200 }, (_, index) => avatarTone(`project-${index}`)));
    expect([...used].sort((a, b) => a - b)).toEqual(tones);
  });

  test("every tone is styled and part of the theme contract", () => {
    const root = join(import.meta.dir, "../../theme");
    const primitives = readFileSync(join(root, "primitives.css"), "utf8");
    const contract = readFileSync(join(root, "tokens.css"), "utf8");
    for (const tone of tones) {
      expect(primitives).toContain(`.ot-avatar[data-avatar="${tone}"]`);
      expect(contract).toContain(`var(--ot-avatar-${tone}-soft)`);
      expect(contract).toContain(`var(--ot-avatar-${tone}-ink)`);
    }
  });
});

describe("initials", () => {
  test("takes the first letter of the first two words", () => {
    expect(initials("Acme · Staging")).toBe("AS");
    expect(initials("client")).toBe("CL");
    expect(initials("···")).toBe("?");
  });
});
