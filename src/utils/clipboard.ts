import { Logger } from "@/services/logger";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const success = document.execCommand("copy");
      return success;
    } catch (err) {
      Logger.error("Clipboard copy failed:", err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
