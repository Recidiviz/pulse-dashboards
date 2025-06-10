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

import {
  ClientRecord,
  FullName,
  ResidentRecord,
  StaffRecord,
  WorkflowsJusticeInvolvedPersonRecord,
} from "~datatypes";

import { AnyWorkflowsSystemConfig, StaffFilter } from "../core/models/types";
import { CombinedUserRecord, PersonUpdateRecord } from "../FirestoreStore";
import { ActiveFeatureVariantRecord } from "../RootStore/types";
import { Client } from "./Client";
import {
  Opportunity,
  OpportunityManagerInterface,
  OpportunityMapping,
} from "./Opportunity";
import { Resident } from "./Resident";
import { CollectionDocumentSubscription } from "./subscriptions";
import { SupervisionTaskInterface } from "./Task/types";

export type JusticeInvolvedPerson = {
  /**
   * can be used to look up documents related to this person in Firestore
   */
  recordId: string;
  /**
   * The record for this person
   */
  record: PersonRecordType;
  /**
   * person identifier ingested from external system
   */
  externalId: string;
  /**
   * Unique, reversible identifier for PII-restricted contexts
   */
  pseudonymizedId: string;
  /**
   * person identifier for human use: may not be unique/consistent
   */
  displayId: string;
  stateCode: string;
  fullName: FullName;
  displayName: string;
  displayPreferredName: string;
  assignedStaff: StaffRecord | undefined;
  assignedStaffId?: string;
  assignedStaffPseudoId?: string;
  assignedStaffFullName: string;
  profileUrl: string;
  supervisionTasks?: SupervisionTaskInterface;
  opportunityManager: OpportunityManagerInterface;
  /**
   * Contains only the opportunity objects that have been hydrated and validated.
   * In most cases these are the only ones that should actually be displayed to users.
   */
  opportunities: OpportunityMapping;
  /**
   * All opportunities for a person flattened into a list
   */
  flattenedOpportunities: Opportunity[];
  /**
   * Subset of `verifiedOpportunities` that are fully eligible.
   */
  opportunitiesEligible: OpportunityMapping;
  /**
   * Subset of `verifiedOpportunities` that are almost eligible.
   */
  opportunitiesAlmostEligible: OpportunityMapping;
  /**
   * Subset of `verifiedOpportunities` that have been marked ineligible.
   */
  opportunitiesDenied: OpportunityMapping;
  /**
   * Contains the person updates, ex: preferredName
   */
  personUpdatesSubscription?: CollectionDocumentSubscription<PersonUpdateRecord>;
  trackProfileViewed: () => void;
  /**
   * The values of the fields on the person record that are used to return search results. Defaults to
   * the person's assigned staff ID.
   */
  searchIdValues: string[];

  /**
   * The searchIdValues, broken out by searchField
   */
  searchIdValuesBySearchField: Record<string, string[]>;
  /**
   * The category of search that was conducted (officer, facility, or facility unit.)
   */
  systemConfig: AnyWorkflowsSystemConfig;
  /**
   * Returns the personType either "CLIENT" or "RESIDENT"
   */
  personType: PersonType;
  /**
   * Optional text to display on all opportunities this person is eligible for.
   */
  bannerText?: string;
};

export type PersonType = "CLIENT" | "RESIDENT";

export type PersonRecordType =
  | WorkflowsJusticeInvolvedPersonRecord
  | ClientRecord
  | ResidentRecord;

export type PersonClassForRecord<RecordType extends PersonRecordType> =
  RecordType extends ResidentRecord
    ? Resident
    : RecordType extends ClientRecord
      ? Client
      : JusticeInvolvedPerson;

export type EligibilityStatus =
  | "opportunitiesEligible"
  | "opportunitiesAlmostEligible"
  | "opportunitiesDenied";

/**
 * Represents URL params for a workflows route
 */
export type WorkflowsRouteParams = {
  urlSection?: string;
  page?: string;
  personId?: string;
  opportunityPseudoId?: string;
};

export type StaffFilterFunction = (
  user: CombinedUserRecord,
  featureVariants: ActiveFeatureVariantRecord,
) => StaffFilter | undefined;
