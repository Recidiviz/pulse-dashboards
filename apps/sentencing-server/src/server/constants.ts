import { EtlHelper } from "~fastify-data-import-plugin";
import {
  transformAndLoadCaseData,
  transformAndLoadClientData,
  transformAndLoadInsightData,
  transformAndLoadOffenseData,
  transformAndLoadOpportunityData,
  transformAndLoadStaffData,
} from "~sentencing-server/import/handle-import/utils";

export const SUPPORTED_STATE_CODES = ["US_ID"];

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/case_record.py
export const CASES_FILE_NAME = "sentencing_case_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/staff_record.py
export const STAFF_FILE_NAME = "sentencing_staff_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/client_record.py
export const CLIENTS_FILE_NAME = "sentencing_client_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/community_opportunity_record.py
export const OPPORTUNITIES_FILE_NAME =
  "sentencing_community_opportunity_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/case_insights.py
export const INSIGHTS_FILE_NAME = "case_insights_record.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/charge_record.py
export const OFFENSES_FILE_NAME = "sentencing_charge_record.json";

export const FILE_NAME_TO_ETL_HELPER: Record<string, EtlHelper> = {
  [CASES_FILE_NAME]: transformAndLoadCaseData,
  [STAFF_FILE_NAME]: transformAndLoadStaffData,
  [CLIENTS_FILE_NAME]: transformAndLoadClientData,
  [OPPORTUNITIES_FILE_NAME]: transformAndLoadOpportunityData,
  [INSIGHTS_FILE_NAME]: transformAndLoadInsightData,
  [OFFENSES_FILE_NAME]: transformAndLoadOffenseData,
};
