import type { JSX } from "solid-js";

interface LiveRegionProps {
  /** Text read by screen readers each time it changes. Empty announces nothing. */
  message: string | undefined;
  /** `assertive` interrupts the reader: keep it for errors. */
  politeness?: "polite" | "assertive";
}

/**
 * Visually hidden live region. Keep it mounted for the lifetime of the surface
 * and only change `message`: screen readers ignore regions inserted together
 * with their content.
 */
export const LiveRegion = (props: LiveRegionProps): JSX.Element => (
  <div
    class="sr-only"
    role={props.politeness === "assertive" ? "alert" : "status"}
    aria-live={props.politeness ?? "polite"}
    aria-atomic="true"
  >
    {props.message ?? ""}
  </div>
);
