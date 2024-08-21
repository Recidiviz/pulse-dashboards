// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

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
