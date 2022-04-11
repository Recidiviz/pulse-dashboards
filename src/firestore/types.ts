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

import { TransformedCompliantReportingReferral } from "../PracticesStore/CompliantReportingReferralRecord";

/**
 * Staff-level data exported from the Recidiviz data platform.
 * Staff may be identified independently as users and as officers with active caseloads
 * based on the properties of this object.
 */
export type StaffRecord = {
  name: string;
  district?: string;
  id: string;
  stateCode: string;
  /**
   * If they have an email address they are a known user
   */
  email: string | null;
  /**
   * Only staff with caseloads need to be included in filters
   */
  hasCaseload: boolean;
};

/**
 * User-level data generated within this application
 */
export type UserUpdateRecord = {
  email: string;
  stateCode: string;
  savedOfficers?: string[];
};

/**
 * Combines user data from this application and the Recidiviz platform into a single object
 */
export type CombinedUserRecord = {
  info: StaffRecord;
  updates?: UserUpdateRecord;
};

const OPPORTUNITY_TYPES = ["compliantReporting"] as const;
/**
 * Values of this union map to key prefixes in client records
 */
export type OpportunityType = typeof OPPORTUNITY_TYPES[number];
export function isOpportunityType(s: string): s is OpportunityType {
  return OPPORTUNITY_TYPES.includes(s as OpportunityType);
}

export type FullName = {
  givenNames?: string;
  middleName?: string;
  surname?: string;
};

export type SpecialConditionsStatus = "none" | "terminated" | "current";

/**
 * A nested object of all client-level data from the Recidiviz data platform
 */
export type ClientRecord = {
  personExternalId: string;
  pseudonymizedId: string;
  stateCode: string;
  personName: FullName;
  officerId: string;
  supervisionType: string;
  supervisionLevel?: string;
  supervisionLevelStart?: Timestamp | string;
  address?: string;
  phoneNumber?: string;
  expirationDate?: Timestamp | string;
  currentBalance: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Timestamp | string;
  feeExemptions?: string;
  specialConditionsFlag: SpecialConditionsStatus;
  specialConditions: string[];
  nextSpecialConditionsCheck?: Timestamp | string;
  lastSpecialConditionsNote?: string;
  specialConditionsTerminatedDate?: string;
  compliantReportingEligible?: CompliantReportingEligibleRecord;
};

export type CompliantReportingFinesFeesEligible =
  | "low_balance"
  | "exempt"
  | "regular_payments";

export type CompliantReportingEligibleRecord = {
  eligibilityCategory: string;
  eligibleLevelStart: Timestamp | string;
  currentOffenses: string[];
  lifetimeOffensesExpired: string[];
  judicialDistrict: string | null;
  finesFeesEligible: CompliantReportingFinesFeesEligible;
  drugScreensPastYear: { result: string; date: Timestamp | string }[];
  sanctionsPastYear: string[];
  mostRecentArrestCheck?: Timestamp | string;
};

/**
 * A nested object of all client-level data generated within this application
 */
export type ClientUpdateRecord = {
  compliantReporting?: CompliantReportingUpdateRecord;
};

type UpdateLog = {
  date: Timestamp;
  by: string;
};

export type CompliantReportingDenial = {
  reasons: string[];
  otherReason?: string;
  updated: UpdateLog;
};

export type CompliantReportingReferralForm = {
  updated: UpdateLog;
  data?: Partial<TransformedCompliantReportingReferral>;
};

type CompliantReportingUpdateRecord = {
  denial?: CompliantReportingDenial;
  referralForm?: CompliantReportingReferralForm;
  completed?: {
    update: UpdateLog;
  };
};

export type FormFieldData = Record<string, boolean | string | string[]>;
