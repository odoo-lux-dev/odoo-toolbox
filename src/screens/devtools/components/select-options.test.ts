import { expect, test } from "bun:test";

import { rankOptions, type SelectOption } from "@/screens/devtools/components/select-options";

const option = (value: string, label = value): SelectOption => ({ value, label });

test("rankOptions puts exact, then prefix, then inner matches first", () => {
  const options = [
    option("res.partner.bank"),
    option("x_partner"),
    option("partner", "Contact"),
    option("partner.tag"),
    option("res.users", "Partner"),
  ];
  expect(rankOptions(options, "partner").map((o) => o.value)).toEqual([
    "partner",
    "res.users",
    "partner.tag",
    "x_partner",
    "res.partner.bank",
  ]);
});

test("rankOptions prefers the shorter value among prefix matches", () => {
  const options = [option("sale.order.line"), option("sale.order")];
  expect(rankOptions(options, "sale").map((o) => o.value)).toEqual([
    "sale.order",
    "sale.order.line",
  ]);
});
