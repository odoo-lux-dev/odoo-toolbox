import "./style.css";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/ui/skip-link";
import { useExtensionTheme } from "@/hooks/use-extension-theme";
import { popupCommands } from "@/screens/popup/commands";
import { Footer } from "@/screens/popup/components/footer";
import { Header } from "@/screens/popup/components/header";
import { ProjectList } from "@/screens/popup/components/project-list";

export const App = () => {
  useExtensionTheme();
  const palette = useCommandPalette();

  return (
    // While the palette is open the popup keeps enough height to show it.
    <div
      class={`flex max-h-150 w-popup flex-col bg-canvas text-ink ${palette.open() ? "min-h-120" : ""}`}
    >
      <SkipLink />
      <Header />
      <main id={MAIN_CONTENT_ID} class="flex min-h-0 flex-1 flex-col">
        <ProjectList />
      </main>
      <Footer />
      <CommandPalette
        open={palette.open()}
        onClose={() => palette.setOpen(false)}
        commands={popupCommands}
        scope="popup"
      />
    </div>
  );
};
