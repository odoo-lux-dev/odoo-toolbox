/** Splits a `/pattern/flags` input; anything else is a pattern without flags. */
export const parseRegexInput = (input: string) => {
  const match = input.match(/^\/(.+)\/([a-z]*)$/);
  return match ? { pattern: match[1], flags: match[2] } : { pattern: input, flags: "" };
};

export const isValidRegex = (userInput: string) => {
  try {
    const { pattern, flags } = parseRegexInput(userInput);
    new RegExp(pattern, flags);
    return true;
  } catch {
    return false;
  }
};
