import { ReportType } from "@prisma/client";

export const REPORT_TYPE_ENUM_TO_STRING = {
  [ReportType.FullPSI]: "Full PSI",
  [ReportType.FileReview]: "File Review",
  [ReportType.FileReviewWithUpdatedLSIRScore]: "File Review + Updated LSI-R",
};
