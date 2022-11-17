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

import { FullName } from "../firestore";
import { Expect, Extends } from "../utils/typeUtils";
import { Client } from "./Client";
import {
  CompliantReportingOpportunity,
  EarlyTerminationOpportunity,
  EarnedDischargeOpportunity,
  LSUOpportunity,
  OpportunityType,
  PastFTRDOpportunity,
  SupervisionLevelDowngradeOpportunity,
  UsTnExpirationOpportunity,
} from "./Opportunity";
import { OpportunityBase } from "./Opportunity/OpportunityBase";

export type OpportunityMapping = {
  earlyTermination?: EarlyTerminationOpportunity;
  compliantReporting?: CompliantReportingOpportunity;
  earnedDischarge?: EarnedDischargeOpportunity;
  LSU?: LSUOpportunity;
  pastFTRD?: PastFTRDOpportunity;
  supervisionLevelDowngrade?: SupervisionLevelDowngradeOpportunity;
  usTnExpiration?: UsTnExpirationOpportunity;
};
// The following line will typecheck only if OpportunityMapping is exhaustive
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CheckOpportunityMappingType = Expect<
  Extends<
    Required<OpportunityMapping>,
    Record<OpportunityType, OpportunityBase<Client, any, any>>
  >
>;

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
};
