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

export enum FileType {
  Cases,
  Staff,
  Clients,
  Opportunities,
  Insights,
  Offenses,
}

export const FILE_NAME_TO_FILE_TYPE: Record<string, FileType> = {
  [CASES_FILE_NAME]: FileType.Cases,
  [STAFF_FILE_NAME]: FileType.Staff,
  [CLIENTS_FILE_NAME]: FileType.Clients,
  [OPPORTUNITIES_FILE_NAME]: FileType.Opportunities,
  [INSIGHTS_FILE_NAME]: FileType.Insights,
  [OFFENSES_FILE_NAME]: FileType.Offenses,
};
