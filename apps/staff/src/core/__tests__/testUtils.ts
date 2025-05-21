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

import { add } from "date-fns";

import { OpportunityType } from "~datatypes";

import CONFIG_FIXTURES from "../../../tools/fixtures/opportunities";
import { AutoSnoozeUpdate, ManualSnoozeUpdate } from "../../FirestoreStore";
import { Client, Opportunity } from "../../WorkflowsStore";
import { OpportunityBase } from "../../WorkflowsStore/Opportunity/OpportunityBase";
import { OpportunityConfiguration } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations";
import { apiOpportunityConfigurationSchema } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/dtos/ApiOpportunityConfigurationSchema";
import { formatEligibilityText } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/models/ApiOpportunityConfigurationImpl";
import { apiOpportunityConfigurationFactory } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/models/CustomOpportunityConfigurations";
import { OTHER_KEY } from "../../WorkflowsStore/utils";

export const mockOpportunityConfigs = Object.fromEntries(
  Object.entries(CONFIG_FIXTURES).map(([type, rawConfig]) => [
    type,
    apiOpportunityConfigurationFactory(
      type as OpportunityType,
      apiOpportunityConfigurationSchema.parse(rawConfig),
      {
        activeFeatureVariants: {},
      } as any,
    ),
  ]),
) as Record<OpportunityType, OpportunityConfiguration>;

export const mockOpportunity: Opportunity<Client> = {
  record: {},
  almostEligible: false,
  caseNoteHeaders: [],
  person: {
    displayPreferredName: "Client Name",
    recordId: "123",
    stateCode: "US_OZ",
    expirationDate: new Date(2025, 1, 1),
  } as Client,
  denialReasons: { CODE: "Denial Code", [OTHER_KEY]: "Other" },
  defaultEligibility: "ELIGIBLE",
  denial: undefined,
  lastViewed: undefined,
  hydrate: () => undefined,
  hydrationState: { status: "hydrated" },
  requirementsAlmostMet: [],
  requirementsMet: [],
  reviewStatus: "PENDING",
  snoozedBy: undefined,
  snoozedOnDate: new Date(),
  manualSnooze: {} as ManualSnoozeUpdate,
  autoSnooze: {} as AutoSnoozeUpdate,
  manualSnoozeUntilDate: undefined,
  deleteOpportunityDenialAndSnooze: async () => undefined,
  setAutoSnooze: async () => undefined,
  setManualSnooze: async () => undefined,
  setLastViewed: () => undefined,
  setDenialReasons: async () => undefined,
  setCompletedIfEligible: () => undefined,
  setOtherReasonText: async () => undefined,
  type: "pastFTRD",
  eligibilityDate: undefined,
  isSnoozed: false,
  trackListViewed: () => undefined,
  trackPreviewed: () => undefined,
  supportsExternalRequest: false,
  deniedTabTitle: "Marked Ineligible",
  tabTitle: (tabGroup) =>
    tabGroup === "ELIGIBILITY STATUS" ? "Eligible Now" : "Other",
  subcategory: undefined,
  submittedSubcategories: undefined,
  subcategoryHeadingFor: () => undefined,
  compare: () => 1,
  showEligibilityStatus: () => true,
  nonOMSRequirements: [],
  isSubmitted: false,
  submittedTabTitle: "Submitted",
  submittedUpdate: undefined,
  markSubmittedAndGenerateToast: async () => undefined,
  deleteSubmitted: async () => undefined,
  config: {
    systemType: "SUPERVISION",
    stateCode: "US_ID",
    urlSection: "pastFTRD",
    label: "Past FTRD",
    priority: "NORMAL",
    initialHeader:
      "Search for officers above to review clients whose full-term release date is near or has passed.",
    eligibilityTextForCount(count) {
      return formatEligibilityText(
        "client[|s] [is|are] nearing or past their full-term release date",
        count,
      );
    },
    eligibilityDateTextForTab: () => "Eligibility Date",
    callToAction:
      "Review clients who are nearing or past their full-term release date and email clerical to move them to history.",
    compareBy: [{ field: "reviewStatus" }],
    firestoreCollection: "US_ID-pastFTRDReferrals",
    snooze: {
      autoSnoozeParams: (snoozedOn: Date) => add(snoozedOn, { days: 30 }),
    },
    tabGroups: {
      "ELIGIBILITY STATUS": ["Eligible Now", "Submitted", "Marked Ineligible"],
    },
    isEnabled: true,
    denialReasons: { CODE: "Denial Code", [OTHER_KEY]: "Other" },
    methodologyUrl: "https://example.com",
    sidebarComponents: [],
    isAlert: false,
    submittedTabTitle: "Submitted",
    deniedTabTitle: "Marked Ineligible",
    omsCriteriaHeader: "OMS Requirements",
    denialAdjective: "Ineligible",
    denialNoun: "Ineligibility",
    eligibleCriteriaCopy: {},
    ineligibleCriteriaCopy: {},
    nonOmsCriteriaHeader: "Requirements to Check",
    nonOmsCriteria: [],
    homepagePosition: 1,
    emptyTabCopy: {},
    tabPrefaceCopy: {},
    supportsAlmostEligible: false,
    supportsDenial: true,
    supportsSubmitted: true,
    highlightCasesOnHomepage: false,
    highlightedCaseCtaCopy: "highlighted CTA",
    overdueOpportunityCalloutCopy: "overdue",
    zeroGrantsTooltip:
      "Officer has not granted this opportunity in the past 12 months",
    caseNoteHeaders: [],
  },
  sentryTrackingId: undefined,
  instanceDetails: undefined,
  selectId: "SELECT_ID",
  firestoreUpdateDocId: "pastFTRD",
  denied: false,
  highlightCalloutText: "Highlight me!",
  labelAddendum: undefined,
  accordionKey: "pastFTRD",
  snoozeCompanionOpportunities: [],
  requiresRevertConfirmation: false,
  revertConfirmationCopy: {
    headerText: "Are you sure you want to revert changes?",
    descriptionText: "This action cannot be undone.",
  },
  handleAdditionalUndoActions: async () => undefined,
  showRevertLinkFallback: false,
  eligibilityStatusLabel(includeReasons?: boolean) {
    return OpportunityBase.prototype.eligibilityStatusLabel.call(
      this,
      includeReasons,
    );
  },
};
