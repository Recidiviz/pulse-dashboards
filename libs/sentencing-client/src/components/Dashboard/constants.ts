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

import { StaffCase } from "../../api";

type StaffCaseClient = StaffCase["Client"];

export const DUE_DATE_KEY: keyof StaffCase = "dueDate";

export const CLIENT_KEY: keyof StaffCase = "Client";

export const REPORT_TYPE_KEY: keyof StaffCase = "reportType";

const CLIENT_ID_KEY: keyof NonNullable<StaffCaseClient> = "externalId";

export const ID_KEY = [CLIENT_KEY, CLIENT_ID_KEY].join(".");

export const OFFENSE_KEY: keyof StaffCase = "offense";

export const STATUS_KEY: keyof StaffCase = "status";

const FULL_NAME_KEY: keyof NonNullable<StaffCaseClient> = "fullName";

export const CLIENT_FULL_NAME_KEY = [CLIENT_KEY, FULL_NAME_KEY].join(".");

export const NO_CASES_MESSAGE = "No cases to review";

export const SortKeys = {
  ClientFullName: CLIENT_FULL_NAME_KEY,
  DueDate: DUE_DATE_KEY,
};
