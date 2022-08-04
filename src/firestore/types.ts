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

import { TransformedCompliantReportingReferral } from "../WorkflowsStore";

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

export type UserRecord = StaffRecord & { email: string };
export function isUserRecord(
  staffRecord: StaffRecord
): staffRecord is UserRecord {
  return staffRecord.email !== null;
}

/**
 * User-level data generated within this application
 */
export type UserUpdateRecord = {
  // this is for supervisors or others without caseloads to configure their default view
  savedOfficers?: string[];
  // this persists their most recent caseload selection
  selectedOfficerIds?: string[];
};

// TEST is useful for testing, as the name suggests,
// but also so that we don't have an empty union when there are no feature variants in use
export type FeatureVariant = "TEST" | "CompliantReportingAlmostEligible";
/**
 * For each feature, an optional activeDate can control when the user gets access.
 * If this is missing, access will be granted immediately.
 * The `variant` property can be used to segment users to different variants of the feature,
 * e.g. for A/B testing.
 */
export type FeatureVariantRecord = Partial<
  Record<FeatureVariant, { activeDate?: Timestamp; variant?: string }>
>;

/**
 * Combines user data from this application and the Recidiviz platform into a single object
 */
export type CombinedUserRecord = {
  info: UserRecord;
  updates?: UserUpdateRecord;
  featureVariants?: FeatureVariantRecord;
};

export type FullName = {
  givenNames?: string;
  middleName?: string;
  surname?: string;
};

export type SpecialConditionsStatus = "none" | "terminated" | "current";

export type SpecialConditionCode = {
  condition: string;
  conditionDescription: string;
};

/**
 * A nested object of all client-level data from the Recidiviz data platform
 */
export type ClientRecord = {
  recordId: string;
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
  earliestSupervisionStartDateInLatestSystem?: string;
  expirationDate?: Timestamp | string;
  currentBalance: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Timestamp | string;
  feeExemptions?: string;
  specialConditionsFlag: SpecialConditionsStatus;
  specialConditions: string[];
  boardConditions?: SpecialConditionCode[];
  nextSpecialConditionsCheck?: Timestamp | string;
  lastSpecialConditionsNote?: string;
  specialConditionsTerminatedDate?: string;
  compliantReportingEligible?: CompliantReportingEligibleRecord;
  earlyTerminationEligible?: boolean;
};

export type CompliantReportingFinesFeesEligible =
  | "low_balance"
  | "exempt"
  | "regular_payments";

export type CompliantReportingEligibleRecord = {
  eligibilityCategory: string;
  /** Any number greater than zero indicates the client is _almost_ eligible.
   * In practice this field should not be optional once it is supported by ETL,
   * but for backwards compatibility it is for now
   */
  stateCode: string;
  remainingCriteriaNeeded?: number;
  eligibleLevelStart: Timestamp | string;
  currentOffenses: string[];
  lifetimeOffensesExpired: string[];
  judicialDistrict: string | null;
  finesFeesEligible: CompliantReportingFinesFeesEligible;
  drugScreensPastYear: { result: string; date: Timestamp | string }[];
  sanctionsPastYear: string[];
  mostRecentArrestCheck?: Timestamp | string;
  pastOffenses: string[];
  zeroToleranceCodes?: { contactNoteType: string; contactNoteDate: string }[];
  almostEligibleCriteria?: {
    currentLevelEligibilityDate?: string;
    passedDrugScreenNeeded?: boolean;
    paymentNeeded?: boolean;
    recentRejectionCodes?: string[];
    seriousSanctionsEligibilityDate?: string;
  };
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

export type CompliantReportingUpdateRecord = {
  denial?: CompliantReportingDenial;
  referralForm?: CompliantReportingReferralForm;
  completed?: {
    update: UpdateLog;
  };
};

export type FormFieldData = Record<string, boolean | string | string[]>;
