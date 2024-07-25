import { ReportType } from "@prisma/client";

import { FileType } from "~sentencing-server/import/common/constants";
import {
  transformAndLoadCaseData,
  transformAndLoadClientData,
  transformAndLoadInsightData,
  transformAndLoadOffenseData,
  transformAndLoadOpportunityData,
  transformAndLoadStaffData,
} from "~sentencing-server/import/handle-import/utils";

export const FILE_TYPE_TO_ETL_HELPER = {
  [FileType.Cases]: transformAndLoadCaseData,
  [FileType.Staff]: transformAndLoadStaffData,
  [FileType.Clients]: transformAndLoadClientData,
  [FileType.Opportunities]: transformAndLoadOpportunityData,
  [FileType.Insights]: transformAndLoadInsightData,
  [FileType.Offenses]: transformAndLoadOffenseData,
};

export const EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE = {
  "PSI Assigned Full": ReportType.FullPSI,
  "PSI File Review Assigned": ReportType.FileReview,
  "PSI File Review w/LSI Assigned": ReportType.FileReviewWithUpdatedLSIRScore,
};
