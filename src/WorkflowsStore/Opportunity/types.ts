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

import { Hydratable } from "../../core/models/types";
import { Denial, UpdateLog } from "../../firestore";
import { JusticeInvolvedPerson } from "../types";
import { FormBase } from "./Forms/FormBase";

const SUPERVISION_OPPORTUNITY_TYPES = [
  "compliantReporting",
  "earlyTermination",
  "earnedDischarge",
  "LSU",
  "pastFTRD",
  "supervisionLevelDowngrade",
  "usIdSupervisionLevelDowngrade",
  "usTnExpiration",
] as const;
export type SupervisionOpportunityType = typeof SUPERVISION_OPPORTUNITY_TYPES[number];

const INCARCERATION_OPPORTUNITY_TYPES = ["usMeSCCP"] as const;
export type IncarcerationOpportunityType = typeof INCARCERATION_OPPORTUNITY_TYPES[number];

const OPPORTUNITY_TYPES = [
  ...SUPERVISION_OPPORTUNITY_TYPES,
  ...INCARCERATION_OPPORTUNITY_TYPES,
] as const;
/**
 * Values of this union map to key prefixes in client records
 */
export type OpportunityType = typeof OPPORTUNITY_TYPES[number];
export const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  compliantReporting: "Compliant Reporting",
  earlyTermination: "Early Termination",
  earnedDischarge: "Earned Discharge",
  LSU: "Limited Supervision Unit",
  pastFTRD: "Past FTRD",
  supervisionLevelDowngrade: "Supervision Level Downgrade",
  usIdSupervisionLevelDowngrade: "Supervision Level Downgrade",
  usMeSCCP: "Supervised Community Confinement Program",
  usTnExpiration: "Expiration (TEPE)",
};

export const OPPORTUNITY_TYPE_URLS: Record<OpportunityType, string> = {
  compliantReporting: "compliantReporting",
  earlyTermination: "earlyTermination",
  earnedDischarge: "earnedDischarge",
  LSU: "LSU",
  pastFTRD: "pastFTRD",
  supervisionLevelDowngrade: "supervisionLevelDowngrade",
  usIdSupervisionLevelDowngrade: "supervisionLevelDowngrade",
  usMeSCCP: "SCCP",
  usTnExpiration: "expiration",
};
export const OPPORTUNITY_TYPES_FOR_URL: Record<
  string,
  OpportunityType
> = Object.fromEntries(
  Object.entries(OPPORTUNITY_TYPE_URLS).map(([k, v]) => [
    v,
    k as OpportunityType,
  ])
);
export function isOpportunityTypeUrl(s: string): boolean {
  return s in OPPORTUNITY_TYPES_FOR_URL;
}

export type OpportunityRequirement = {
  text: string;
  tooltip?: string;
};

// ranked roughly by actionability
export const OPPORTUNITY_STATUS_RANKED = [
  "PENDING",
  "IN_PROGRESS",
  "DENIED",
  "COMPLETED",
  "ALMOST",
] as const;
export type OpportunityStatus = typeof OPPORTUNITY_STATUS_RANKED[number];

export type DenialReasonsMap = Record<string, string>;

export type DefaultEligibility = "ELIGIBLE" | "MAYBE";

export type OpportunityCaseNote = {
  noteTitle?: string;
  noteBody: string;
  eventDate: Date;
};

export type WithCaseNotes = {
  caseNotes: Record<string, OpportunityCaseNote[]>;
};

/**
 * An Opportunity is associated with a single client.
 * The client is assumed to be eligible for the Opportunity unless the
 * `almostEligible` flag is set. There is no "ineligible" flag! Ineligibility
 * must be indicated by the absence of an Opportunity.
 * Common form fields are included as optional, for convenience in cases
 * where form-related behavior is optional. Opportunity-specific extensions of this type
 * should generally override them to be required.
 */
export interface Opportunity<
  PersonType extends JusticeInvolvedPerson = JusticeInvolvedPerson
> extends Hydratable {
  almostEligible: boolean;
  // TODO: move this to status component once almost-eligible is standardized on TES
  almostEligibleStatusMessage?: string;
  almostEligibleRecommendedNote?: { title: string; text: string };
  person: PersonType;
  readonly defaultEligibility: DefaultEligibility;
  form?: FormBase<any>;
  requirementsAlmostMet: OpportunityRequirement[];
  requirementsMet: OpportunityRequirement[];
  reviewStatus: OpportunityStatus;
  readonly type: OpportunityType;
  denialReasonsMap: DenialReasonsMap;
  denial: Denial | undefined;
  firstViewed: UpdateLog | undefined;
  setFirstViewedIfNeeded: () => void;
  setCompletedIfEligible: () => void;
  eligibilityDate: Date | undefined;
  readonly isAlert: boolean;
  supportsDenial: boolean;
  setDenialReasons: (reasons: string[]) => Promise<void>;
  setOtherReasonText: (otherReason?: string) => Promise<void>;
  trackListViewed: () => void;
  trackPreviewed: () => void;
  readonly policyOrMethodologyUrl: string;
}

export type OpportunityFactory<
  OpportunitySubtype extends OpportunityType,
  PersonType extends JusticeInvolvedPerson
> = (type: OpportunitySubtype, person: PersonType) => Opportunity;
