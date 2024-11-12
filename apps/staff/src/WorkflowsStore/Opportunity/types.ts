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

import { DocumentData } from "firebase/firestore";

import { OpportunityType } from "~datatypes";
import { Hydratable } from "~hydration-utils";

import { StatusPalette } from "../../core/utils/workflowsUtils";
import {
  AutoSnoozeUpdate,
  Denial,
  ExternalRequestUpdate,
  ExternalSystemRequestStatus,
  ManualSnoozeUpdate,
  SharedSnoozeUpdate,
  Submission,
  UpdateLog,
} from "../../FirestoreStore";
import { PartialRecord } from "../../utils/typeUtils";
import { JusticeInvolvedPerson } from "../types";
import { FormBase } from "./Forms/FormBase";
import { OpportunityConfiguration } from "./OpportunityConfigurations";
import { SnoozeConfiguration } from "./OpportunityConfigurations/modules/SnoozeConfiguration/interfaces/ISnoozeConfiguration";
import { opportunityConstructors } from "./opportunityConstructors";

export type OpportunityRequirement = {
  isHeading?: boolean;
  text: string;
  tooltip?: string;
  key?: string; // only needed when multiple requirements might have the same text
};

// ranked roughly by actionability
export const OPPORTUNITY_STATUS_RANKED = [
  "PENDING",
  "IN_PROGRESS", // form viewed
  "SUBMITTED", // user marked as "submitted" or "in progress"
  "DENIED",
  "COMPLETED",
  "ALMOST",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUS_RANKED)[number];
export const PRIORITY_STATUS_RANKED = ["HIGH", "NORMAL"] as const;

export type DenialReasonsMap = Record<string, string>;

export type DefaultEligibility = "ELIGIBLE" | "MAYBE";

export type OpportunityCaseNote = {
  noteTitle?: string;
  noteBody?: string;
  eventDate?: Date;
};

export type OpportunityNotification = {
  id: string;
  title?: string;
  body: string;
  cta?: string; // if the CTA is omitted, an "x" button will be shown instead.
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
  PersonType extends JusticeInvolvedPerson = JusticeInvolvedPerson,
> extends Hydratable {
  config: OpportunityConfiguration;
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
  nonOMSRequirements: OpportunityRequirement[];
  reviewStatus: OpportunityStatus;
  readonly type: OpportunityType;
  previewBannerText?: string;
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
  readonly supportsExternalRequest: boolean;
  externalRequestData?: ExternalRequestUpdate<any>;
  readonly externalRequestStatusMessage?: string;
  setAutoSnooze: (
    autoSnoozeParams: NonNullable<SnoozeConfiguration["autoSnoozeParams"]>,
    reasons: string[],
  ) => Promise<void>;
  setManualSnooze: (days: number, reasons: string[]) => Promise<void>;
  setDenialReasons: (reasons: string[]) => Promise<void>;
  setOtherReasonText: (otherReason?: string) => Promise<void>;
  trackListViewed: () => void;
  trackPreviewed: () => void;
  readonly deniedTabTitle: string;
  readonly caseNotesTitle?: string;
  readonly hideUnknownCaseNoteDates?: boolean;
  readonly eligibilityCallToActionText?: string;
  readonly subcategory?: string;
  subcategoryHeadingFor: (subcategory: string) => string | undefined;
  readonly subcategoryText?: string;
  tabTitle: (category?: OpportunityTabGroup) => OpportunityTab;
  compare: (other: Opportunity) => number;
  showEligibilityStatus: (component: Component) => boolean;
  readonly portionServedRequirement?: string[];
  readonly DenialConfirmationModal?: React.ComponentType<DenialConfirmationModalProps>;
  isSubmitted: boolean;
  readonly submittedTabTitle: string;
  markSubmitted: (subcategory?: string) => Promise<void>;
  deleteSubmitted: () => Promise<void>;
  submittedUpdate: Submission | undefined;
  readonly submittedSubcategories: string[] | undefined;
  sentryTrackingId: string | undefined;
  instanceDetails: string | undefined;
  labelAddendum: string | undefined;
  selectId: string;
  firestoreUpdateDocId: string;
  denied: boolean;
  highlightCalloutText: string;
  accordionKey: string;
  customStatusPalette?: StatusPalette;
}

export type Component = "OpportunityModuleHeader" | "OpportunityCapsule";

export type OpportunityFactory<
  OpportunitySubtype extends OpportunityType,
  PersonType extends JusticeInvolvedPerson,
> = (type: OpportunitySubtype, person: PersonType) => Opportunity | undefined;

export type OpportunityTab =
  | "Eligible Now"
  | "Almost Eligible"
  | "Overridden"
  | "Marked Ineligible"
  // "Other" should never appear in the actual frontend, but exists to provide a default value
  // for when the record is undefined on the Opportunity class
  | "Other"
  | "Overdue For Hearing"
  | "Missing Review Date"
  | "Upcoming Hearings"
  | "Due this week"
  | `Overdue as of ${string}`
  | "Coming up"
  | "Overdue"
  | "Upcoming"
  | "Due now"
  | "Assessment Complete"
  | "In Progress"
  | "Submitted"
  // For US_AZ TPR/DTP opportunities
  | "Fast Trackers"
  | "Approved by Time Comp"
  | "Pending";

export type OpportunityTabGroup =
  | "ELIGIBILITY STATUS"
  | "GENDER"
  | "GENDER - Transgender Only";
// NOTE: Consider changing the key type to string, because the source of truth is what is set in the configs as opposed to the code.
export type OpportunityTabGroups = PartialRecord<
  OpportunityTabGroup,
  Readonly<OpportunityTab[]>
>;

export type DenialConfirmationModalProps = {
  opportunity: Opportunity;
  reasons: string[];
  otherReason: string;
  snoozeUntilDate?: Date;
  showModal: boolean;
  onCloseFn: () => any;
  onSuccessFn: () => any;
};

export type OpportunityPriority = "NORMAL" | "HIGH";

export type OpportunityMapping = {
  [K in OpportunityType]?: InstanceType<(typeof opportunityConstructors)[K]>[];
};

export interface OpportunityManagerInterface extends Hydratable {
  opportunities: OpportunityMapping;
  setSelectedOpportunityTypes: (opportunityTypes: OpportunityType[]) => void;
}
