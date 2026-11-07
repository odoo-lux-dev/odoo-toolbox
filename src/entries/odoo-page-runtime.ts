import { PAGE_RUNTIME_GLOBAL } from "@/services/extension-messages";
import { runPageScript } from "@/services/owl-runtime";

// Injected in the MAIN world by the background before it runs a DevTools page script.
export default defineUnlistedScript(() => {
  (window as unknown as Record<string, unknown>)[PAGE_RUNTIME_GLOBAL] = runPageScript;
});
