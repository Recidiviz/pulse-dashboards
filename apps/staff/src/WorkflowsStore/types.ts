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

import { FullName } from "~datatypes";

import { SearchField, StaffFilter } from "../core/models/types";
import {
  ClientRecord,
  CombinedUserRecord,
  PersonUpdateRecord,
  WorkflowsJusticeInvolvedPersonRecord,
  WorkflowsResidentRecord,
} from "../FirestoreStore";
import { ActiveFeatureVariantRecord } from "../RootStore/types";
import { Client } from "./Client";
import { OpportunityManagerInterface, OpportunityMapping } from "./Opportunity";
import { Resident } from "./Resident";
import { CollectionDocumentSubscription } from "./subscriptions";
import { SupervisionTaskInterface } from "./Task/types";

export type JusticeInvolvedPerson = {
  /**
   * can be used to look up documents related to this person in Firestore
   */
  recordId: string;
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
   * The value of the field on the person record that is used to return search results. Defaults to
   * the person's assigned staff ID.
   */
  searchIdValue: string | undefined;
  /**
   * The category of search that was conducted (officer, facility, or facility unit.)
   */
  searchField: SearchField | undefined;
  /**
   * The date when the data about this person was most recently synced from the state
   */
  lastDataFromState: Date;
  /**
   * Optional text to display on all opportunities this person is eligible for.
   */
  bannerText?: string;
};

export type PersonRecordType =
  | WorkflowsJusticeInvolvedPersonRecord
  | ClientRecord
  | WorkflowsResidentRecord;

export type PersonClassForRecord<RecordType extends PersonRecordType> =
  RecordType extends WorkflowsResidentRecord
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
export type WorkflowsRouteParams = { page?: string; personId?: string };

export type StaffFilterFunction = (
  user: CombinedUserRecord,
  featureVariants: ActiveFeatureVariantRecord,
) => StaffFilter | undefined;
