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

import {
  ClientRecord,
  FullName,
  JusticeInvolvedPersonRecord,
  ResidentRecord,
} from "../firestore";
import { Expect, Extends } from "../utils/typeUtils";
import { Client } from "./Client";
import {
  CompliantReportingOpportunity,
  EarlyTerminationOpportunity,
  EarnedDischargeOpportunity,
  IncarcerationOpportunityType,
  LSUOpportunity,
  PastFTRDOpportunity,
  SupervisionOpportunityType,
  UsMeSCCPOpportunity,
  UsTnExpirationOpportunity,
  UsTnSupervisionLevelDowngradeOpportunity,
} from "./Opportunity";
import { OpportunityBase } from "./Opportunity/OpportunityBase";
import { UsIdSupervisionLevelDowngradeOpportunity } from "./Opportunity/UsIdSupervisionLevelDowngradeOpportunity";
import { Resident } from "./Resident";

export type SupervisionOpportunityMapping = {
  earlyTermination?: EarlyTerminationOpportunity;
  compliantReporting?: CompliantReportingOpportunity;
  earnedDischarge?: EarnedDischargeOpportunity;
  LSU?: LSUOpportunity;
  pastFTRD?: PastFTRDOpportunity;
  supervisionLevelDowngrade?: UsTnSupervisionLevelDowngradeOpportunity;
  usIdSupervisionLevelDowngrade?: UsIdSupervisionLevelDowngradeOpportunity;
  usTnExpiration?: UsTnExpirationOpportunity;
};
// The following line will typecheck only if the keys of
// SupervisionOpportunityMapping are exhaustive
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CheckSupervisionOpportunityMappingType = Expect<
  Extends<
    Required<SupervisionOpportunityMapping>,
    Record<SupervisionOpportunityType, OpportunityBase<Client, any, any>>
  >
>;

export type IncarcerationOpportunityMapping = {
  usMeSCCP?: UsMeSCCPOpportunity;
};
// The following line will typecheck only if the keys of
// IncarcerationOpportunityMapping are exhaustive
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CheckIncarcerationOpportunityMappingType = Expect<
  Extends<
    Required<IncarcerationOpportunityMapping>,
    Record<IncarcerationOpportunityType, OpportunityBase<Resident, any, any>>
  >
>;

export type OpportunityMapping = IncarcerationOpportunityMapping &
  SupervisionOpportunityMapping;

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
  stateCode: string;
  fullName: FullName;
  displayName: string;
  assignedStaffId: string;
  /**
   * Contains all expected opportunity objects. Mainly useful for inspecting or interacting with
   * their loading and hydration status.
   */
  potentialOpportunities: OpportunityMapping;
  /**
   * Contains only the opportunity objects that have been hydrated and validated.
   * In most cases these are the only ones that should actually be displayed to users.
   */
  verifiedOpportunities: OpportunityMapping;
  /**
   * Subset of `verifiedOpportunities` that are fully eligible.
   */
  opportunitiesEligible: OpportunityMapping;
  /**
   * Subset of `verifiedOpportunities` that are almost eligible.
   */
  opportunitiesAlmostEligible: OpportunityMapping;
  allOpportunitiesLoaded: boolean;
  trackProfileViewed: () => void;
};

export type PersonRecordType =
  | JusticeInvolvedPersonRecord
  | ClientRecord
  | ResidentRecord;

export type PersonClassForRecord<
  RecordType extends PersonRecordType
> = RecordType extends ResidentRecord
  ? Resident
  : RecordType extends ClientRecord
  ? Client
  : JusticeInvolvedPerson;

export type OpportunityTypeForRecord<
  PersonRecord extends PersonRecordType
> = PersonRecord extends ClientRecord
  ? SupervisionOpportunityType
  : PersonRecord extends ResidentRecord
  ? IncarcerationOpportunityType
  : never;
