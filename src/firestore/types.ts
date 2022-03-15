// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import type { Timestamp } from "firebase/firestore";

/**
 * User-level data exported from the Recidiviz data platform
 */
export type UserRecord = {
  name: string;
  district: string;
  id: string;
  stateCode: string;
};

/**
 * User-level data generated within this application
 */
export type UserUpdateRecord = {
  savedOfficers?: string[];
  savedDistricts?: string[];
};

/**
 * Combines user data from this application and the Recidiviz platform into a single object
 */
export type CombinedUserRecord = {
  info: UserRecord;
  updates: UserUpdateRecord;
};

/**
 * Values of this union map to key prefixes in client records
 */
export type OpportunityType = "compliantReporting";

/**
 * A nested object of all client-level data from the Recidiviz data platform
 */
export type ClientRecord = {
  personExternalId: string;
  stateCode: string;
  personName: string;
  officerId: string;
  supervisionType: string;
  supervisionLevel: string;
  supervisionLevelStart: Timestamp;
  compliantReportingEligible?: CompliantReportingEligibleRecord;
};

export type CompliantReportingEligibleRecord = {
  offenseType: string[];
  judicialDistrict: string;
  lastDrugNegative: Timestamp[];
  lastSanction: string | null;
};

/**
 * A nested object of all client-level data generated within this application
 */
export type ClientUpdateRecord = {
  personExternalId: string;
  personName: string;
  stateCode: string;
  compliantReportingStatus?: CompliantReportingStatusRecord;
};

type CompliantReportingStatusCode = "ELIGIBLE" | "DENIED";

export type CompliantReportingStatusRecord = {
  personExternalId: string;
  status: CompliantReportingStatusCode;
  deniedReasons: string[];
  statusUpdated: {
    date: Timestamp;
    by: string;
  };
};
