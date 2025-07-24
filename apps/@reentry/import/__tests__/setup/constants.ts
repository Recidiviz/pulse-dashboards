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
  CASE_MANAGERS_FILE_NAME,
  CLIENTS_FILE_NAME,
  SUPERVISION_OFFICERS_FILE_NAME,
} from "~@reentry/import/constants";

export const TEST_BUCKET = "test-bucket";
export const TEST_STATE_CODE = "US_ID";
export const TEST_CASE_MANAGERS_FILE_NAME = `${TEST_STATE_CODE}/${CASE_MANAGERS_FILE_NAME}`;
export const TEST_SUPERVISION_OFFICERS_FILE_NAME = `${TEST_STATE_CODE}/${SUPERVISION_OFFICERS_FILE_NAME}`;
export const TEST_CLIENTS_FILE_NAME = `${TEST_STATE_CODE}/${CLIENTS_FILE_NAME}`;
