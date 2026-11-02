export type OrmReportRecord = {
  id: number;
  display_name: string;
  report_name: string;
};

export type PrintOptionsReturn = {
  reports: OrmReportRecord[];
  currentResId: number;
  currentResModel: string;
  context: Record<string, unknown>;
};
