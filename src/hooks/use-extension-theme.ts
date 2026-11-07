import {
  createMemo,
  createRenderEffect,
  createRoot,
  createSignal,
  on,
  type Accessor,
} from "solid-js";

import { useSettings } from "@/hooks/use-settings";
import {
  onSystemColorSchemeChange,
  resolveTheme,
  setThemeAttributes,
  type ResolvedTheme,
  type ThemeSettings,
} from "@/theme/apply-theme";

let theme: Accessor<ResolvedTheme> | undefined;

/** Appearance settings shown without being saved (command palette preview). */
type ThemePreview = Partial<Pick<ThemeSettings, "extensionUiTheme" | "extensionTheme">>;

const [themePreview, setThemePreview] = createSignal<ThemePreview>();

export const previewTheme = (preview: ThemePreview | undefined): void => {
  setThemePreview(preview);
};

/** Theme of the extension page, from the settings and the OS scheme (for `system`). */
export const useActiveTheme = (): Accessor<ResolvedTheme> => {
  theme ??= createRoot(() => {
    const settings = useSettings();
    const [systemChange, setSystemChange] = createSignal(0);
    onSystemColorSchemeChange(() => setSystemChange((count) => count + 1));
    createRenderEffect(
      on(
        () => [settings().extensionUiTheme, settings().extensionTheme],
        () => setThemePreview(undefined),
        { defer: true },
      ),
    );
    return createMemo(() => {
      systemChange();
      return resolveTheme({ ...settings(), ...themePreview() });
    });
  });
  return theme;
};

/** Applies the extension theme to the document root (or `target`). Call it once per surface root. */
export const useExtensionTheme = (
  target: HTMLElement = document.documentElement,
): Accessor<ResolvedTheme> => {
  const active = useActiveTheme();
  createRenderEffect(() => setThemeAttributes(active(), target));
  return active;
};
