/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { FieldValue } from "@google-cloud/firestore";
import type { Timestamp } from "firebase/firestore";

import { SystemId } from "../core/models/types";
import { FullName } from "../core/types/personMetadata";
import {
  IncarcerationOpportunityType,
  SupervisionOpportunityType,
  SupervisionTaskType,
} from "../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../WorkflowsStore/Opportunity/OpportunityConfigs";
import { UsTnExpirationDraftData } from "../WorkflowsStore/Opportunity/UsTn";
import { FIRESTORE_GENERAL_COLLECTION_MAP as FIRESTORE_GENERAL_COLLECTIONS_MAP } from "./constants";

export type RoleSubtype =
  | "SUPERVISION_OFFICER"
  | "SUPERVISION_OFFICER_SUPERVISOR"
  | "SUPERVISION_DISTRICT_MANAGER"
  | "SUPERVISION_REGIONAL_MANAGER"
  | "SUPERVISION_STATE_LEADERSHIP";

/**
 * Staff-level data exported from the Recidiviz data platform.
 * Staff may be identified independently as users and as officers with active caseloads
 * based on the properties of this object.
 */
export type StaffRecord = {
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
  hasFacilityCaseload: boolean;
  // TODO(#2458): Move towards using the fullName type like for ClientRecord to standardize name formatting. May require BE changes.
  givenNames: string;
  surname: string;
  roleSubtype?: RoleSubtype;
};

export const SYSTEM_ID_TO_CASELOAD_FIELD = {
  SUPERVISION: "hasCaseload",
  INCARCERATION: "hasFacilityCaseload",
} as const;
// This should be `satisfies Record<Exclude<SystemId, "ALL">, keyof StaffRecord>;`
// but we can't use that yet: TODO(#3499)

export type UserRole =
  | "supervision_staff"
  | "facilities_staff"
  | "leadership_role";

export type UserRecord = StaffRecord & { email: string; role?: UserRole };
export function isUserRecord(
  staffRecord: StaffRecord
): staffRecord is UserRecord {
  return staffRecord.email !== null;
}

/**
 * User-level data generated within this application
 */
export type UserUpdateRecord = {
  stateCode: string;
  // this persists their most recent caseload selection
  selectedSearchIds?: string[];
  // previous version of ^, leaving in for backwards compatibility
  selectedOfficerIds?: string[];
  // TODO(#3522): [Workflows][Auth] Rethink district overrides
  overrideDistrictIds?: string[];
};

export type PersonUpdateType = "preferredName" | "preferredContactMethod";
export const contactMethods = ["Call", "Text", "Email", "None"];
export type ContactMethodType = typeof contactMethods[number];
export type PortionServedDates = {
  heading: string;
  date: Date | undefined;
}[];
/**
 * Person-level data generated within this application
 */
export type PersonUpdateRecord = {
  preferredName?: string;
  preferredContactMethod?: ContactMethodType;
};

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

export type SpecialConditionCode = {
  condition: string;
  conditionDescription: string;
};

export const profileMilestoneTypes = [
  "BIRTHDAY_THIS_MONTH",
  "MONTHS_WITHOUT_VIOLATION",
  "MONTHS_ON_SUPERVISION",
  "MONTHS_WITH_CURRENT_EMPLOYER",
] as const;

export const congratulationsMilestoneTypes = [
  "HOUSING_TYPE_IS_NOT_TRANSIENT",
  "SUSTAINABLE_HOUSING_6_MONTHS",
  "SUSTAINABLE_HOUSING_12_MONTHS",
  "NO_VIOLATION_WITHIN_6_MONTHS",
  "NO_VIOLATION_WITHIN_12_MONTHS",
  "GAINED_EMPLOYMENT",
  "EMPLOYED_6_MONTHS",
  "EMPLOYED_12_MONTHS",
] as const;

export type MilestoneType =
  | typeof profileMilestoneTypes[number]
  | typeof congratulationsMilestoneTypes[number];
export type Milestone = {
  type: MilestoneType;
  text: string;
};

export type JusticeInvolvedPersonRecord = {
  recordId: string;
  personExternalId: string;
  pseudonymizedId: string;
  displayId: string;
  stateCode: string;
  personName: FullName;
  allEligibleOpportunities:
    | SupervisionOpportunityType[]
    | IncarcerationOpportunityType[];
  officerId: string;
};

export type ClientEmployer = {
  name: string;
  address?: string;
};

/**
 * Data from the Recidiviz data platform about a person on supervision
 */
export type ClientRecord = JusticeInvolvedPersonRecord & {
  personType: "CLIENT";
  district?: string;
  supervisionType?: string;
  supervisionLevel?: string;
  supervisionLevelStart?: Timestamp | string;
  address?: string;
  phoneNumber?: string;
  supervisionStartDate?: string;
  expirationDate?: Timestamp | string;
  currentBalance?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Timestamp | string;
  specialConditions?: string[];
  boardConditions?: SpecialConditionCode[];
  allEligibleOpportunities: SupervisionOpportunityType[];
  currentEmployers?: ClientEmployer[];
  milestones?: Milestone[];
  emailAddress?: string;
};

/**
 * Data from the Recidiviz data platform about an incarcerated person
 */
export type ResidentRecord = JusticeInvolvedPersonRecord & {
  personType: "RESIDENT";
  facilityId?: string;
  unitId?: string;
  facilityUnitId?: string;
  custodyLevel?: string;
  admissionDate?: Timestamp | string;
  releaseDate?: Timestamp | string;
  allEligibleOpportunities: IncarcerationOpportunityType[];
  portionServedNeeded?: "1/2" | "2/3";
};

export type LocationRecord = {
  stateCode: string;
  system: SystemId;
  idType: keyof ClientRecord | keyof ResidentRecord;
  id: string;
  name: string;
};

// TODO(#2263): Remove CompliantReportingFinesFeesEligible and CompliantReportingEligibleRecord once Client record is migrated
// to use boolean value for compliantReportingEligible.
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
  sanctionsPastYear: { ProposedSanction: string }[];
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

export type UpdateLog = {
  date: Timestamp;
  by: string;
};

export type Denial<DenialReason = string> = {
  reasons: DenialReason[];
  otherReason?: string;
  updated?: UpdateLog;
};

export type FormFieldData = Record<
  string,
  boolean | string | string[] | FieldValue
>;

export type SharedSnoozeUpdate = {
  snoozedBy: string;
  snoozedOn: string;
};

export type ManualSnoozeUpdate = {
  snoozeForDays?: number;
  snoozeUntil?: never;
} & SharedSnoozeUpdate;

export type AutoSnoozeUpdate = {
  snoozeUntil?: string;
  snoozeForDays?: never;
} & SharedSnoozeUpdate;

export type OpportunityUpdate = {
  denial?: Denial;
  manualSnooze?: ManualSnoozeUpdate;
  autoSnooze?: AutoSnoozeUpdate;
  completed?: {
    update: UpdateLog;
  };
  lastViewed?: UpdateLog;
};

export type OpportunityUpdateWithForm<FormType> = OpportunityUpdate & {
  referralForm?: { updated: UpdateLog; data?: Partial<FormType> };
};

export type SupervisionTaskUpdate = {
  [key in SupervisionTaskType]?: {
    snoozeForDays: number;
  } & SharedSnoozeUpdate;
};

/**
 * CONGRATULATED_ANOTHER_WAY: User has already sent congratulations in another way.
 * PENDING: User has started to compose a message but has not sent anything yet.
 * IN_PROGRESS: Request sent to backend and backend has sent it to Twilio
 * SUCCESS: Twilio confirms that message has been sent to the carrier
 * FAILURE: Twilio returns an error that the message could not be sent, or
 *        our backend has an error.
 * DECLINED: Officer declined to send a message
 *
 * NOTE: SUCCESS and FAILURE statuses will be updated in Firestore by the backend API.
 */
export type TextMessageStatus =
  | "CONGRATULATED_ANOTHER_WAY"
  | "DECLINED"
  | ExternalSystemRequestStatus;

export type DeclineReason =
  | "MILESTONE_NOT_MET"
  | "CLIENT_DECLINED_TEXTS"
  | "MISSING_CONTACT_INFO"
  | "Other";

export const TextMessageStatuses: Record<TextMessageStatus, TextMessageStatus> =
  {
    CONGRATULATED_ANOTHER_WAY: "CONGRATULATED_ANOTHER_WAY",
    DECLINED: "DECLINED",
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
  } as const;

export type MilestonesMessage = {
  updated: UpdateLog;
  status: TextMessageStatus;
  errors?: string[];
  declinedReasons?: Denial<DeclineReason>;
  pendingMessage?: string;
  message?: string;
  recipient?: string;
  sentBy?: string;
  mid?: string;
  stateCode?: string;
  userHash?: string;
};

export type ExternalSystemRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILURE";

export type ExternalRequestUpdate<RequestData> = {
  status: ExternalSystemRequestStatus;
  submitted: UpdateLog;
} & RequestData;

export type UsTnContactNote = {
  note: Record<number, string[]>;
  noteStatus?: Record<number, ExternalSystemRequestStatus>;
  error?: string;
};

export type UsTnExpirationOpportunityUpdate =
  OpportunityUpdateWithForm<UsTnExpirationDraftData> & {
    contactNote: ExternalRequestUpdate<UsTnContactNote>;
  };
export type FirestoreGeneralCollectionKey =
  keyof typeof FIRESTORE_GENERAL_COLLECTIONS_MAP;

export type FirestoreGeneralCollection =
  typeof FIRESTORE_GENERAL_COLLECTIONS_MAP[FirestoreGeneralCollectionKey];

export type FirestoreOpportunityReferrals = {
  [K in keyof typeof OPPORTUNITY_CONFIGS]: `${K}Referrals`;
}[keyof typeof OPPORTUNITY_CONFIGS];

export type FirestoreOpportunityCollection = {
  [K in keyof typeof OPPORTUNITY_CONFIGS]: typeof OPPORTUNITY_CONFIGS[K]["firestoreCollection"];
}[keyof typeof OPPORTUNITY_CONFIGS];

export type FirestoreCollectionKey =
  | FirestoreGeneralCollectionKey
  | FirestoreOpportunityReferrals;

export type FirestoreCollectionsMap = Record<
  FirestoreCollectionKey,
  FirestoreGeneralCollection | FirestoreOpportunityCollection
>;
