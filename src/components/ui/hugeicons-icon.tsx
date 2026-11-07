import { createMemo, splitProps, type JSX } from "solid-js";

export type IconData = ReadonlyArray<readonly [string, Record<string, unknown>]>;

export interface HugeiconsIconProps {
  icon: IconData;
  size?: number | string;
  strokeWidth?: number | string;
  class?: string;
  ref?: (el: SVGSVGElement) => void;
  /** Other SVG attributes (aria-label, title...). */
  [key: string]: unknown;
}

const DEFAULT_ATTRS: Record<string, string> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders a Hugeicons icon (`[tag, attrs][]` data). The paths are set as markup:
 * the icon data are plain SVG element descriptions.
 */
export function HugeiconsIcon(props: HugeiconsIconProps): JSX.Element {
  const [local, rest] = splitProps(props, ["icon", "size", "strokeWidth", "class", "ref"]);

  const size = () => local.size ?? 24;
  const strokeWidth = () =>
    local.strokeWidth === undefined ? undefined : String(local.strokeWidth);

  const innerHTML = createMemo(() =>
    local.icon
      // Duotone layers (with an opacity) are drawn first, under the main paths.
      .toSorted(([, a], [, b]) => Number(b.opacity !== undefined) - Number(a.opacity !== undefined))
      .map(([tag, attrs]) => {
        const parts = Object.entries(attrs)
          .filter(
            ([key]) =>
              key !== "key" && !(strokeWidth() && (key === "stroke-width" || key === "stroke")),
          )
          .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`);
        if (strokeWidth())
          parts.push(`stroke-width="${escapeAttr(strokeWidth()!)}"`, 'stroke="currentColor"');
        return `<${tag} ${parts.join(" ")} />`;
      })
      .join(""),
  );

  return (
    <svg
      {...DEFAULT_ATTRS}
      {...rest}
      width={size()}
      height={size()}
      class={local.class ?? ""}
      ref={local.ref}
      stroke-width={strokeWidth()}
      stroke={strokeWidth() ? "currentColor" : undefined}
      innerHTML={innerHTML()}
    />
  );
}
