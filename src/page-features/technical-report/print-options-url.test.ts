import { describe, expect, it } from "bun:test";

import { buildReportUrl } from "./print-options-url";

describe("buildReportUrl", () => {
  it("encodes the report context", () => {
    const context = { allowed_company_ids: [2, 1], active_id: 42, name: "A&B" };
    const url = buildReportUrl("pdf", "sale.report_saleorder", 42, context);

    expect(url.startsWith("/report/pdf/sale.report_saleorder/42?context=")).toBe(true);
    expect(url).not.toContain('"');
    expect(url).not.toContain("{");

    const encodedContext = url.split("context=")[1];
    expect(JSON.parse(decodeURIComponent(encodedContext))).toEqual(context);
  });
});
