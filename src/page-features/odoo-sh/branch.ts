import { settingsService } from "@/services/settings-service";
import { parseRegexInput, isValidRegex } from "@/utils/regex";

export const extractBranchFromGitClone = (command: string): string | null =>
  command.match(/(?:--branch|-b)\s+(\S+)/)?.[1] ?? null;

/** Branch name of the branch page, read from its `git clone` command. */
export const getCurrentBranchName = (): string | null =>
  extractBranchFromGitClone(
    document.querySelector<HTMLInputElement>("input.js_git_command")?.value ?? "",
  );

/** Task id found in a branch name with the user's task regex (first capture group). */
export const extractTaskId = async (branchName: string): Promise<string | null> => {
  const taskRegex = await settingsService.get("taskUrlRegex");
  if (!isValidRegex(taskRegex)) return null;
  const { pattern, flags } = parseRegexInput(taskRegex);
  return new RegExp(pattern, flags).exec(branchName)?.[1] ?? null;
};

/** Branch name and button group of a line of the builds page. */
export const getBuildLineParts = (buildLine: Element) => {
  const leftPanel = buildLine.querySelector(".o_sh_build_panel_left");
  return {
    branchName: leftPanel?.querySelector<HTMLElement>(".o_branch_name")?.innerText || null,
    buttonsRow: leftPanel?.querySelector<HTMLElement>(".btn-group") ?? null,
  };
};
