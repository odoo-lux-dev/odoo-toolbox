/** Indents a single-line XML string (`arch_db` is stored without line breaks). */
export const formatXml = (xml: string): string => {
  if (xml.includes("\n")) return xml;
  let indent = 0;
  const lines: string[] = [];
  for (const part of xml.split(/(?=<)/)) {
    const tag = part.trim();
    if (!tag) continue;
    if (tag.startsWith("</")) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + tag);
    const opensElement =
      tag.startsWith("<") &&
      !tag.startsWith("</") &&
      !tag.endsWith("/>") &&
      !tag.startsWith("<?") &&
      !tag.startsWith("<!");
    if (opensElement) indent++;
  }
  return lines.join("\n");
};

/** Escaped XML with colored comments, tag names, attribute names and values (HTML string). */
export const highlightXml = (xml: string): string => {
  const escaped = xml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([\w.:-]+)|\s([\w.:-]+)(=)|"([^"]*)"/g,
    (match, comment, tagOpen, tagName, attrName, equals, value) => {
      if (comment) return `<span style="color: var(--ot-ink-4);">${comment}</span>`;
      if (tagName) return `${tagOpen}<span style="color: var(--color-primary);">${tagName}</span>`;
      if (attrName) return ` <span style="color: var(--color-info);">${attrName}</span>${equals}`;
      if (value !== undefined)
        return `<span style="color: var(--color-success);">"${value}"</span>`;
      return match;
    },
  );
};
