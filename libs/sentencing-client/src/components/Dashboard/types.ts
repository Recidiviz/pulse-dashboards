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

import { StaffCase, StaffCases } from "../../api";
import { MutableCaseAttributes } from "../CaseDetails/types";
import { ARCHIVED_STATUS, CANCELLED_STATUS } from "./constants";

export type CaseListTableCases = StaffCases;

export type CaseListTableCase = StaffCase;

export enum CaseStatusToDisplay {
  NotYetStarted = "Not yet started",
  InProgress = "In Progress",
  Complete = "Complete",
}

export enum CaseStatus {
  NotYetStarted = "NotYetStarted",
  InProgress = "InProgress",
  Complete = "Complete",
}

export type HeaderCell = { key: string; name: string };

export type ContentCell = {
  key: string;
  caseId: string;
  value: string;
};

export type ContentRow = { caseId: string; row: ContentCell[] };

export type RecommendationStatusFilter =
  | CaseStatusToDisplay
  | typeof ARCHIVED_STATUS
  | typeof CANCELLED_STATUS;

export type AttributeKey =
  | "client.externalId"
  | "client.fullName"
  | keyof StaffCase
  | keyof MutableCaseAttributes;
