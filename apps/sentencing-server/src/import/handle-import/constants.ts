import { ReportType } from "@prisma/client";

export const EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE = {
  "PSI Assigned Full": ReportType.FullPSI,
  "PSI File Review Assigned": ReportType.FileReview,
  "PSI File Review w/LSI Assigned": ReportType.FileReviewWithUpdatedLSIRScore,
};
