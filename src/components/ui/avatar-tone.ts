/**
 * Number of avatar tones. Each tone `n` needs `--ot-avatar-<n>-soft|ink` in every
 * theme (tokens.css lists them, the contract test checks every theme) and a
 * `.ot-avatar[data-avatar="<n>"]` rule in primitives.css (avatar-tone.test.ts).
 */
export const AVATAR_TONE_COUNT = 8;

/**
 * Stable tone (1..AVATAR_TONE_COUNT) for a key (project slug...): FNV-1a hash
 * modulo the palette, so a project keeps its color everywhere and across
 * sessions. Colors repeat once there are more projects than tones: the initials
 * stay the identifier.
 */
export const avatarTone = (key: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index++) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % AVATAR_TONE_COUNT) + 1;
};

/** Up to two initials from a display name ("Acme · Staging" → "AS"). */
export const initials = (name: string) => {
  const [first = "", second = ""] = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  const value = second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2);
  return value.toUpperCase() || "?";
};
