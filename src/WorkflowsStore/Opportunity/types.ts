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

import { DocumentData } from "firebase/firestore";

import { Hydratable } from "../../core/models/types";
import { OpportunityProfileModuleName } from "../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import {
  AutoSnoozeUpdate,
  Denial,
  ExternalRequestUpdate,
  ExternalSystemRequestStatus,
  ManualSnoozeUpdate,
  SharedSnoozeUpdate,
  UpdateLog,
} from "../../FirestoreStore";
import { JusticeInvolvedPerson } from "../types";
import { FormBase } from "./Forms/FormBase";
import { AutoSnoozeUntil, OpportunityType } from "./OpportunityConfigs";

export type OpportunityRequirement = {
  isHeading?: boolean;
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
  noteBody?: string;
  eventDate?: Date;
};

export type WithCaseNotes = {
  caseNotes: Record<string, OpportunityCaseNote[]>;
};

export type FormVariant = "deferred";

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
  record: DocumentData | undefined;
  almostEligible: boolean;
  // TODO: move this to status component once almost-eligible is standardized on TES
  almostEligibleStatusMessage?: string;
  almostEligibleRecommendedNote?: { title: string; text: string };
  eligibleStatusMessage?: string;
  person: PersonType;
  readonly defaultEligibility: DefaultEligibility;
  form?: FormBase<any>;
  requirementsAlmostMet: OpportunityRequirement[];
  requirementsMet: OpportunityRequirement[];
  reviewStatus: OpportunityStatus;
  readonly type: OpportunityType;
  denialReasonsMap: DenialReasonsMap;
  denial: Denial | undefined;
  manualSnooze: ManualSnoozeUpdate | undefined;
  autoSnooze: AutoSnoozeUpdate | undefined;
  manualSnoozeUntilDate: Date | undefined;
  snoozedBy: SharedSnoozeUpdate["snoozedBy"] | undefined;
  snoozedOnDate: Date | undefined;
  isSnoozed: boolean;
  snoozeForDays?: number;
  omsSnoozeStatus?: ExternalSystemRequestStatus;
  deleteOpportunityDenialAndSnooze: () => Promise<void>;
  lastViewed: UpdateLog | undefined;
  setLastViewed: () => void;
  setCompletedIfEligible: () => void;
  eligibilityDate: Date | undefined;
  readonly isAlert: boolean;
  supportsDenial: boolean;
  readonly supportsExternalRequest: boolean;
  externalRequestData?: ExternalRequestUpdate<any>;
  readonly externalRequestStatusMessage?: string;
  setAutoSnooze: (
    defaultSnoozeUntilFn: AutoSnoozeUntil["defaultSnoozeUntilFn"],
    reasons: string[]
  ) => Promise<void>;
  setManualSnooze: (days: number, reasons: string[]) => Promise<void>;
  setDenialReasons: (reasons: string[]) => Promise<void>;
  setOtherReasonText: (otherReason?: string) => Promise<void>;
  trackListViewed: () => void;
  trackPreviewed: () => void;
  readonly policyOrMethodologyUrl: string;
  readonly deniedTabTitle: string;
  readonly opportunityProfileModules: OpportunityProfileModuleName[];
  readonly caseNotesTitle?: string;
  readonly hideUnknownCaseNoteDates?: boolean;
  readonly tooltipEligibilityText?: string;
  readonly eligibilityCallToActionText?: string;
  tabTitle?: OpportunityTab;
  tabOrder: Readonly<OpportunityTab[]>;
  compare: (other: Opportunity) => number;
  showEligibilityStatus: (component: Component) => boolean;
  readonly portionServedRequirement?: string[];
  readonly DenialConfirmationModal?: React.ComponentType<DenialConfirmationModalProps>;
}

export type Component = "OpportunityModuleHeader" | "OpportunityCapsule";

export type OpportunityFactory<
  OpportunitySubtype extends OpportunityType,
  PersonType extends JusticeInvolvedPerson
> = (type: OpportunitySubtype, person: PersonType) => Opportunity;

export type OpportunityTab =
  | "Eligible Now"
  | "Almost Eligible"
  | "Overridden"
  | "Marked ineligible"
  // "Other" should never appear in the actual frontend, but exists to provide a default value
  // for when the record is undefined on the Opportunity class
  | "Other"
  | "Overdue For Hearing"
  | "Missing Review Date"
  | "Upcoming Hearings"
  | "Due this week"
  | `Overdue as of ${string}`
  | "Coming up";

export type DenialConfirmationModalProps = {
  opportunity: Opportunity;
  reasons: string[];
  otherReason: string;
  snoozeUntilDate?: Date;
  showModal: boolean;
  onCloseFn: () => any;
  onSuccessFn: () => any;
};
