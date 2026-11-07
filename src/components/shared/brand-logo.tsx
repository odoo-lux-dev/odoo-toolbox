import logoUrl from "@/assets/icon.png";
import { cx } from "@/components/ui/cx";

/** Product logo, always displayed as a circle (see mockups brand spec). */
export const BrandLogo = (props: { size?: number; class?: string }) => (
  <img
    src={logoUrl}
    alt=""
    width={props.size ?? 30}
    height={props.size ?? 30}
    class={cx("shrink-0 rounded-full", props.class)}
  />
);
