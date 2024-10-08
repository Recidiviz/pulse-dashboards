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

import { StaffRecord } from "~datatypes";

import {
  OpportunityTab,
  OpportunityTabGroup,
  OpportunityType,
} from "../../WorkflowsStore/Opportunity";

/**
 * User-level data generated within this application
 */
export type UserUpdateRecord = {
  stateCode: string;
  // this persists their most recent caseload selection
  selectedSearchIds?: string[];
  // TODO(#3522): [Workflows][Auth] Rethink district overrides
  overrideDistrictIds?: string[];
  dismissedOpportunityNotificationIds?: string[];
  // Stores custom orders of tabs when viewing opportunities
  customTabOrderings?: Record<
    OpportunityType,
    Record<OpportunityTabGroup, OpportunityTab[]>
  >;
};
export type UserRecord = Omit<StaffRecord, "email"> & { email: string };
export function isUserRecord(
  staffRecord: StaffRecord,
): staffRecord is UserRecord {
  return typeof staffRecord.email === "string";
}

/**
 * Properties that may be derived from user data but are not directly persisted in Firestore
 */
export type UserMetadata = {
  isDefaultOfficerSelection?: boolean;
};

/**
 * Combines user data from this application and the Recidiviz platform into a single object
 */
export type CombinedUserRecord = {
  info: UserRecord;
  updates?: UserUpdateRecord;
  metadata?: UserMetadata;
};
