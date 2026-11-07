import type { OdooWebClient } from "@/types";

declare global {
  interface Window {
    odoo?: OdooWebClient;
  }
}

export {};
