import { afterEach, beforeEach, expect, test } from "bun:test";

import { resetStorage } from "@@/tests/setup";

import { handleProjectPage } from "./handle-sh-project-page";

let dispose: () => void = () => {};

beforeEach(() => {
  resetStorage();
  document.body.innerHTML =
    '<div class="odoo_sh_app_body"></div><input class="js_git_command" value="git clone -b 17.0-fix x.git">';
});

afterEach(() => dispose());

// Regression: a builds view without build lines stopped the processing of the other
// nodes added by the same mutation.
test("keeps processing the added nodes after an empty builds view", async () => {
  dispose = await handleProjectPage();

  const buildsView = document.createElement("div");
  buildsView.className = "o_builds_view";
  const branchHeader = document.createElement("div");
  branchHeader.className = "o_branch_header";
  branchHeader.innerHTML = '<div class="o_branch_header_title"><h4>17.0-fix</h4></div>';
  const fragment = document.createDocumentFragment();
  fragment.append(buildsView, branchHeader);
  document.querySelector(".odoo_sh_app_body")!.append(fragment);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(document.querySelector(".x-odoo-sh-copy-branch-name")).not.toBeNull();
});
