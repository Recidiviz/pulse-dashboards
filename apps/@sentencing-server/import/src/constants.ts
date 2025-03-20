// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  caseImportSchema,
  clientImportSchema,
  countyAndDistrictImportSchema,
  insightImportSchema,
  offenseImportSchema,
  opportunityImportSchema,
  staffImportSchema,
} from "~@sentencing-server/import/models";
import { transformAndLoadCaseData } from "~@sentencing-server/import/utils/cases";
import { transformAndLoadClientData } from "~@sentencing-server/import/utils/clients";
import { transformAndLoadCountyAndDistrictData } from "~@sentencing-server/import/utils/countiesAndDistricts";
import { transformAndLoadInsightData } from "~@sentencing-server/import/utils/insights";
import { transformAndLoadOffenseData } from "~@sentencing-server/import/utils/offenses";
import { transformAndLoadOpportunityData } from "~@sentencing-server/import/utils/opportunities";
import { transformAndLoadStaffData } from "~@sentencing-server/import/utils/staff";

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
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/sentencing/counties_and_districts.py
export const COUNTIES_AND_DISTRICTS_FILES_NAME =
  "sentencing_counties_and_districts.json";

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [STAFF_FILE_NAME]: {
    schema: staffImportSchema,
    loaderFn: transformAndLoadStaffData,
  },
  [INSIGHTS_FILE_NAME]: {
    schema: insightImportSchema,
    loaderFn: transformAndLoadInsightData,
  },
  [CLIENTS_FILE_NAME]: {
    schema: clientImportSchema,
    loaderFn: transformAndLoadClientData,
  },
  [CASES_FILE_NAME]: {
    schema: caseImportSchema,
    loaderFn: transformAndLoadCaseData,
  },
  [OPPORTUNITIES_FILE_NAME]: {
    schema: opportunityImportSchema,
    loaderFn: transformAndLoadOpportunityData,
  },
  [OFFENSES_FILE_NAME]: {
    schema: offenseImportSchema,
    loaderFn: transformAndLoadOffenseData,
  },
  [COUNTIES_AND_DISTRICTS_FILES_NAME]: {
    schema: countyAndDistrictImportSchema,
    loaderFn: transformAndLoadCountyAndDistrictData,
  },
};
