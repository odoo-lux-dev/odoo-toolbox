export const buildReportUrl = (
  reportType: "html" | "pdf",
  reportName: string,
  recordId: number,
  context: Record<string, unknown>,
): string => {
  const encodedContext = encodeURIComponent(JSON.stringify(context));
  return `/report/${reportType}/${reportName}/${recordId}?context=${encodedContext}`;
};
