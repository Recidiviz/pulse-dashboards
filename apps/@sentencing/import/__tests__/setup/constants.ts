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
  CASES_FILE_NAME,
  CLIENTS_FILE_NAME,
  COUNTIES_AND_DISTRICTS_FILES_NAME,
  INSIGHTS_FILE_NAME,
  OFFENSES_FILE_NAME,
  OPPORTUNITIES_FILE_NAME,
  STAFF_FILE_NAME,
} from "~@sentencing/import/constants";

export const TEST_BUCKET = "test-bucket";
export const TEST_STATE_CODE = "US_ID";
export const TEST_CASES_FILE_NAME = `${TEST_STATE_CODE}/${CASES_FILE_NAME}`;
export const TEST_STAFF_FILE_NAME = `${TEST_STATE_CODE}/${STAFF_FILE_NAME}`;
export const TEST_CLIENTS_FILE_NAME = `${TEST_STATE_CODE}/${CLIENTS_FILE_NAME}`;
export const TEST_INSIGHTS_FILE_NAME = `${TEST_STATE_CODE}/${INSIGHTS_FILE_NAME}`;
export const TEST_OPPORTUNITIES_FILE_NAME = `${TEST_STATE_CODE}/${OPPORTUNITIES_FILE_NAME}`;
export const TEST_OFFENSES_FILE_NAME = `${TEST_STATE_CODE}/${OFFENSES_FILE_NAME}`;
export const TEST_COUNTIES_AND_DISTRICTS_FILES_NAME = `${TEST_STATE_CODE}/${COUNTIES_AND_DISTRICTS_FILES_NAME}`;
