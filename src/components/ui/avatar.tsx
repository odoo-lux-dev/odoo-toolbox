import { avatarTone, initials } from "@/components/ui/avatar-tone";
import { cx } from "@/components/ui/cx";

/**
 * Initials tile colored from `colorKey` with the theme avatar palette
 * (`.ot-icon-tile.ot-avatar`). Decorative: the name is shown next to it.
 */
export const Avatar = (props: { name: string; colorKey: string; class?: string }) => (
  <span
    class={cx(
      "ot-icon-tile ot-avatar font-display text-note font-bold tracking-tight",
      props.class,
    )}
    data-avatar={avatarTone(props.colorKey)}
    aria-hidden="true"
  >
    {initials(props.name)}
  </span>
);
