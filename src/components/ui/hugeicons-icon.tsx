import { createMemo, splitProps, type JSX } from "solid-js";

type IconData = ReadonlyArray<readonly [string, Record<string, unknown>]>;

export interface HugeiconsIconProps {
  icon: IconData;
  altIcon?: IconData;
  showAlt?: boolean;
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  class?: string;
  primaryColor?: string;
  secondaryColor?: string;
  disableSecondaryOpacity?: boolean;
  ref?: (el: SVGSVGElement) => void;
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

export function HugeiconsIcon(props: HugeiconsIconProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "icon",
    "altIcon",
    "showAlt",
    "color",
    "size",
    "strokeWidth",
    "absoluteStrokeWidth",
    "class",
    "primaryColor",
    "secondaryColor",
    "disableSecondaryOpacity",
    "ref",
  ]);

  const sz = () => local.size ?? 24;
  const color = () => local.primaryColor ?? local.color ?? "currentColor";
  const sw = createMemo(() => {
    if (local.strokeWidth === undefined) return undefined;
    return local.absoluteStrokeWidth
      ? (Number(local.strokeWidth) * 24) / Number(sz())
      : local.strokeWidth;
  });
  const currentIcon = createMemo(() =>
    local.showAlt && local.altIcon ? local.altIcon : local.icon,
  );

  const innerHTML = createMemo(() => {
    const swVal = sw();
    const swStr = swVal !== undefined ? String(swVal) : undefined;
    const strokeStr = swVal !== undefined ? "currentColor" : undefined;
    const c = color();

    const children = currentIcon()
      .slice()
      .sort(([, a], [, b]) => {
        const aO = a.opacity !== undefined;
        const bO = b.opacity !== undefined;
        return bO ? 1 : aO ? -1 : 0;
      })
      .map(([tag, attrs]) => {
        const isSecondary = attrs.opacity !== undefined;
        const pathOpacity =
          isSecondary && !local.disableSecondaryOpacity ? attrs.opacity : undefined;

        let strokeVal: string | undefined;
        let fillVal: string | undefined;
        if (local.secondaryColor) {
          if (attrs.stroke !== undefined) {
            strokeVal = isSecondary ? local.secondaryColor : c;
          } else {
            fillVal = isSecondary ? local.secondaryColor : c;
          }
        }

        const allAttrs: string[] = [];
        for (const [k, v] of Object.entries(attrs)) {
          if (k === "key") continue;
          if (k === "stroke-width" && swStr !== undefined) continue;
          if (k === "stroke" && strokeStr !== undefined) continue;
          allAttrs.push(`${k}="${escapeAttr(String(v))}"`);
        }
        if (swStr !== undefined) allAttrs.push(`stroke-width="${escapeAttr(swStr)}"`);
        if (strokeStr !== undefined) allAttrs.push(`stroke="${escapeAttr(strokeStr)}"`);
        if (strokeVal !== undefined) allAttrs.push(`stroke="${escapeAttr(strokeVal)}"`);
        if (fillVal !== undefined) allAttrs.push(`fill="${escapeAttr(fillVal)}"`);
        if (pathOpacity !== undefined)
          allAttrs.push(`opacity="${escapeAttr(String(pathOpacity))}"`);

        return `<${tag} ${allAttrs.join(" ")} />`;
      })
      .join("");

    return children;
  });

  return (
    <svg
      {...DEFAULT_ATTRS}
      {...rest}
      width={sz()}
      height={sz()}
      color={color()}
      class={local.class ?? ""}
      ref={local.ref}
      stroke-width={sw() !== undefined ? String(sw()) : undefined}
      stroke={sw() !== undefined ? "currentColor" : undefined}
      innerHTML={innerHTML()}
    />
  );
}
