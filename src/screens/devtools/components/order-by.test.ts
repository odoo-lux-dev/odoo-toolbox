import { expect, test } from "bun:test";

import { formatOrderBy, parseOrderBy } from "@/screens/devtools/components/order-by";

test("parseOrderBy reads each field with its direction, ascending by default", () => {
  expect(parseOrderBy("name asc, id DESC,  date")).toEqual(["name ASC", "id DESC", "date ASC"]);
  expect(parseOrderBy(" , ")).toEqual([]);
});

test("formatOrderBy writes the order back in Odoo's lower case", () => {
  expect(formatOrderBy(["name ASC", "id DESC"])).toBe("name asc, id desc");
  expect(formatOrderBy(parseOrderBy("name, id desc"))).toBe("name asc, id desc");
});
