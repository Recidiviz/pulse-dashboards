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

import { Client } from "../Client";
import { TransformedCompliantReportingReferral } from "./CompliantReportingReferralRecord";
import {
  EarlyTerminationDraftData,
  TransformedEarlyTerminationReferral,
} from "./EarlyTerminationReferralRecord";

export const OPPORTUNITY_TYPES = [
  "compliantReporting",
  "earlyTermination",
  "earnedDischarge",
  "LSU",
] as const;
/**
 * Values of this union map to key prefixes in client records
 */
export type OpportunityType = typeof OPPORTUNITY_TYPES[number];
export function isOpportunityType(s: string): s is OpportunityType {
  return OPPORTUNITY_TYPES.includes(s as OpportunityType);
}
export const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  compliantReporting: "Compliant Reporting",
  earlyTermination: "Early Termination",
  earnedDischarge: "Earned Discharge",
  LSU: "Limited Supervision Unit",
};

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

/**
 * An Opportunity is associated with a single client.
 * The client is assumed to be eligible for the Opportunity unless the
 * `almostEligible` flag is set. There is no "ineligible" flag! Ineligibility
 * must be indicated by the absence of an Opportunity.
 */
export interface Opportunity {
  almostEligible: boolean;
  almostEligibleRecommendedNote?: { title: string; text: string };
  client: Client;
  rank: number;
  requirementsAlmostMet: OpportunityRequirement[];
  requirementsMet: OpportunityRequirement[];
  reviewStatus: OpportunityStatus;
  statusMessageShort: string;
  statusMessageLong: string;
  readonly type: OpportunityType;
  validate: () => void;
  denialReasonsMap: DenialReasonsMap;
}

export interface CompliantReportingFormInterface {
  printText: string;
  formData: Partial<TransformedCompliantReportingReferral>;
  // TODO: Remove draftData once opportunity update subscriptions move to Opportunity class
  draftData: Partial<TransformedCompliantReportingReferral>;
  setDataField: (
    key: string,
    value: boolean | string | string[]
  ) => Promise<void>;
}

export interface EarlyTerminationFormInterface {
  printText: string;
  metadata: TransformedEarlyTerminationReferral["metadata"] | undefined;
  addDepositionLine: () => void;
  removeDepositionLine: (key: string) => void;
  additionalDepositionLines: string[];
  formData: Partial<EarlyTerminationDraftData>;
  // TODO: Remove draftData once opportunity update subscriptions move to Opportunity class
  draftData: Partial<EarlyTerminationDraftData>;
  setDataField: (
    key: string,
    value: boolean | string | string[]
  ) => Promise<void>;
}

export type CompliantReportingOpportunity = CompliantReportingFormInterface &
  Opportunity;
export type EarlyTerminationOpportunity = EarlyTerminationFormInterface &
  Opportunity;
export type EarnedDischargeOpportunity = Opportunity;
export type LSUOpportunity = Opportunity;
