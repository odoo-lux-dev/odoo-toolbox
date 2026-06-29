import { describe, expect, it } from "bun:test";

import {
  getOdooInfoFromWindow,
  parseOdooUrl,
  retrieveMatchingOwlComponentRecursively,
  getCurrentSearchValues,
  getCurrentPageInfoFromWindow,
  getOdooContextFromWindow,
  resolveDoActionFunction,
} from "./owl-runtime";

describe("getOdooInfoFromWindow", () => {
  it("returns null version when odoo is undefined", () => {
    const result = getOdooInfoFromWindow(undefined);
    expect(result.version).toBeNull();
    expect(result.majorVersion).toBeNull();
  });

  it("parses version 17 from server_version_info", () => {
    const odoo = {
      info: {
        server_version_info: ["17", "0"],
        db: "test_db",
      },
    };
    const result = getOdooInfoFromWindow(odoo as never);
    expect(result.version).toBe(17);
    expect(result.majorVersion).toBe(17);
    expect(result.database).toBe("test_db");
  });

  it("strips saas~ prefix", () => {
    const odoo = {
      info: {
        server_version_info: ["saas~16", "4"],
      },
    };
    const result = getOdooInfoFromWindow(odoo as never);
    expect(result.version).toBe(16.4);
    expect(result.majorVersion).toBe(16);
  });

  it("strips .0 suffix", () => {
    const odoo = {
      info: {
        server_version_info: ["14", "0"],
      },
    };
    const result = getOdooInfoFromWindow(odoo as never);
    expect(result.version).toBe(14);
  });

  it("falls back to session_info", () => {
    const odoo = {
      session_info: {
        server_version_info: ["15", "0"],
        db: "session_db",
      },
    };
    const result = getOdooInfoFromWindow(odoo as never);
    expect(result.version).toBe(15);
    expect(result.database).toBe("session_db");
  });
});

describe("parseOdooUrl", () => {
  it("parses id and model from hash", () => {
    const result = parseOdooUrl("#id=42&model=res.partner", "/odoo/res.partner");
    expect(result.ids).toBe(42);
    expect(result.model).toBe("res.partner");
    expect(result.viewType).toBe("form");
  });

  it("parses cids into allowed_company_ids", () => {
    const result = parseOdooUrl("#cids=1,2,3", "/odoo");
    expect(result.context.allowed_company_ids).toEqual([1, 2, 3]);
  });

  it("extracts id from pathname when no model in hash", () => {
    const result = parseOdooUrl("", "/odoo/sale.order/99");
    expect(result.ids).toBe(99);
    expect(result.model).toBeNull();
  });

  it("returns null ids when pathname has no number", () => {
    const result = parseOdooUrl("", "/odoo/sale.order");
    expect(result.ids).toBeNull();
  });

  it("uses viewType from hash", () => {
    const result = parseOdooUrl("#viewType=list", "/odoo");
    expect(result.viewType).toBe("list");
  });
});

describe("retrieveMatchingOwlComponentRecursively", () => {
  it("matches component by name regex", () => {
    const component = { name: "ControllerComponent" };
    const result = retrieveMatchingOwlComponentRecursively(component, /^ControllerComponent$/);
    expect(result).toBe(component);
  });

  it("returns undefined when no match", () => {
    const component = { name: "SomethingElse" };
    const result = retrieveMatchingOwlComponentRecursively(component, /^ControllerComponent$/);
    expect(result).toBeUndefined();
  });

  it("recursively searches children", () => {
    const tree = {
      name: "Root",
      children: {
        a: { name: "SomeWidget" },
        b: {
          name: "FormController",
          children: {
            c: { name: "ListRenderer" },
          },
        },
      },
    };
    const result = retrieveMatchingOwlComponentRecursively(tree, /Controller$/);
    expect(result?.name).toBe("FormController");
  });

  it("finds nested ListRenderer", () => {
    const tree = {
      name: "ControllerComponent",
      children: {
        a: {
          name: "FormController",
          children: {
            b: { name: "ListRenderer" },
          },
        },
      },
    };
    const result = retrieveMatchingOwlComponentRecursively(tree, /ListRenderer$/);
    expect(result?.name).toBe("ListRenderer");
  });

  it("returns undefined for undefined input", () => {
    expect(retrieveMatchingOwlComponentRecursively(undefined, /test/)).toBeUndefined();
  });
});

describe("getOdooContextFromWindow", () => {
  it("returns empty object when no odoo", () => {
    expect(getOdooContextFromWindow(undefined)).toEqual({});
  });

  it("returns empty object when version is null", () => {
    const odoo = { info: {} };
    expect(getOdooContextFromWindow(odoo as never)).toEqual({});
  });

  it("reads context from __WOWL_DEBUG__", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {
        root: {
          user: {
            context: { lang: "en_US", uid: 2 },
          },
        },
      },
    };
    const result = getOdooContextFromWindow(odoo as never);
    expect(result).toEqual({ lang: "en_US", uid: 2 });
  });

  it("falls back to __DEBUG__ legacy context", () => {
    const odoo = {
      info: { server_version_info: ["14", "0"] },
      __DEBUG__: {
        services: {
          user: {
            context: {
              user_context: { lang: "fr_FR" },
            },
          },
        },
      },
    };
    const result = getOdooContextFromWindow(odoo as never);
    expect(result).toEqual({ lang: "fr_FR" });
  });
});

describe("getCurrentSearchValues", () => {
  it("returns url data when id and model present in hash", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
    };
    const result = getCurrentSearchValues(odoo as never, {
      hash: "#id=42&model=res.partner",
      pathname: "/odoo",
    });
    expect(result.ids).toBe(42);
    expect(result.model).toBe("res.partner");
  });

  it("returns context only when no Owl component tree", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {},
    };
    const result = getCurrentSearchValues(odoo as never, {
      hash: "",
      pathname: "/odoo",
    });
    expect(result.context).toEqual({});
  });

  it("extracts model and resId from Owl controller props (form view)", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {
        root: {
          __owl__: {
            name: "ControllerComponent",
            children: {
              a: {
                name: "FormController",
                props: {
                  resModel: "sale.order",
                  resId: 15,
                  context: { lang: "en_US" },
                },
              },
            },
            props: { type: "form" },
          },
        },
      },
    };
    const result = getCurrentSearchValues(odoo as never, {
      hash: "",
      pathname: "/odoo",
    });
    expect(result.model).toBe("sale.order");
    expect(result.ids).toBe(15);
    expect(result.viewType).toBe("form");
  });

  it("extracts selected record IDs from ListRenderer (list view)", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {
        root: {
          __owl__: {
            name: "ControllerComponent",
            children: {
              a: {
                name: "ListController",
                props: {
                  resModel: "res.partner",
                  context: {},
                },
                children: {
                  b: {
                    name: "ListRenderer",
                    props: {
                      list: {
                        selection: [{ resId: 1 }, { resId: 3 }, { resId: "bad" }],
                      },
                    },
                  },
                },
              },
            },
            props: { type: "list" },
          },
        },
      },
    };
    const result = getCurrentSearchValues(odoo as never, {
      hash: "",
      pathname: "/odoo",
    });
    expect(result.model).toBe("res.partner");
    expect(result.ids).toEqual([1, 3]);
    expect(result.viewType).toBe("list");
  });
});

describe("getCurrentPageInfoFromWindow", () => {
  it("returns empty object when no majorVersion", () => {
    expect(getCurrentPageInfoFromWindow(undefined, { hash: "", pathname: "/" }, "")).toEqual({});
  });

  it("returns model, recordIds, viewType and title for form view", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {
        root: {
          __owl__: {
            name: "ControllerComponent",
            children: {
              a: {
                name: "FormController",
                props: {
                  resModel: "res.partner",
                  resId: 5,
                  context: {},
                },
              },
            },
            props: { type: "form" },
          },
        },
      },
    };
    const result = getCurrentPageInfoFromWindow(
      odoo as never,
      { hash: "", pathname: "/odoo" },
      "Partner - Odoo",
    );
    expect(result.model).toBe("res.partner");
    expect(result.recordIds).toEqual([5]);
    expect(result.viewType).toBe("form");
    expect(result.title).toBe("Partner - Odoo");
  });

  it("returns recordIds array for list view with selection", () => {
    const odoo = {
      info: { server_version_info: ["17", "0"] },
      __WOWL_DEBUG__: {
        root: {
          __owl__: {
            name: "ControllerComponent",
            children: {
              a: {
                name: "ListController",
                props: {
                  resModel: "sale.order",
                  context: {},
                },
                children: {
                  b: {
                    name: "ListRenderer",
                    props: {
                      list: {
                        selection: [{ resId: 10 }, { resId: 20 }],
                      },
                    },
                  },
                },
              },
            },
            props: { type: "list" },
          },
        },
      },
    };
    const result = getCurrentPageInfoFromWindow(
      odoo as never,
      { hash: "", pathname: "/odoo" },
      "Sales Orders - Odoo",
    );
    expect(result.model).toBe("sale.order");
    expect(result.recordIds).toEqual([10, 20]);
    expect(result.viewType).toBe("list");
  });
});

describe("resolveDoActionFunction", () => {
  it("returns undefined when no odoo", () => {
    expect(resolveDoActionFunction(undefined)).toBeUndefined();
  });

  it("finds doAction in actionService", () => {
    const fn = () => {};
    const odoo = {
      __WOWL_DEBUG__: {
        root: {
          actionService: { doAction: fn },
        },
      },
    };
    expect(resolveDoActionFunction(odoo as never)).toBe(fn);
  });

  it("falls back to __DEBUG__ do_action", () => {
    const fn = () => {};
    const odoo = {
      __DEBUG__: {
        services: {
          "web.web_client": { do_action: fn },
        },
      },
    };
    expect(resolveDoActionFunction(odoo as never)).toBe(fn);
  });

  it("returns undefined for non-function", () => {
    const odoo = {
      __WOWL_DEBUG__: {
        root: {
          actionService: { doAction: "not a function" },
        },
      },
    };
    expect(resolveDoActionFunction(odoo as never)).toBeUndefined();
  });
});
