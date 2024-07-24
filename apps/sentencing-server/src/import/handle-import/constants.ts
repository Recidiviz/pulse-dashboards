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
