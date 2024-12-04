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

import { ClientRecord, OpportunityType } from "~datatypes";

import { FeatureVariant, TenantId } from "../../../RootStore/types";
import { JusticeInvolvedPerson } from "../../types";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityConfiguration } from "../OpportunityConfigurations";

export const ineligibleClientRecord: ClientRecord = {
  recordId: "us_xx_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_XX",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const mockUsXxOpp: OpportunityType = "mockUsXxOpp" as OpportunityType;
export const mockUsXxTwoOpp: OpportunityType =
  "mockUsXxTwoOpp" as OpportunityType;

export class TestOpportunity<
  T extends JusticeInvolvedPerson,
> extends OpportunityBase<T, any, any> {
  constructor(...[person, type, rootStore, record]: any[]) {
    super(person, type, rootStore, record);
  }
}

export const mockUsXxOppConfig: OpportunityConfiguration = {
  priority: "HIGH",
  tabGroups: { "ELIGIBILITY STATUS": [] },
  eligibilityTextForCount: (count: number) => "cool",
  omsCriteriaHeader: "OMS Requirements",
  eligibleCriteriaCopy: {},
  ineligibleCriteriaCopy: {},
  nonOmsCriteriaHeader: "Requirements to Check",
  nonOmsCriteria: [],
  compareBy: [],
  systemType: "SUPERVISION",
  stateCode: "US_XX" as TenantId,
  urlSection: "mockOpportunity",
  label: "Mock Opportunity",
  isEnabled: true,
  featureVariant: "usXxMockOpportunity" as FeatureVariant,
  initialHeader: "Mock initial header to search for something",
  callToAction:
    "Review these clients and complete their auto-generated TEPE Note.",
  firestoreCollection: "US_XX_mockOpportunity",
  sidebarComponents: [],
  denialReasons: {},
  methodologyUrl: "",
  homepagePosition: 1,
  deniedTabTitle: "Marked Ineligible",
  denialAdjective: "Ineligible",
  denialNoun: "Ineligibility",
  submittedTabTitle: "Submitted",
  emptyTabCopy: {},
  tabPrefaceCopy: {},
  supportsDenial: false,
  supportsSubmitted: false,
  supportsAlmostEligible: false,
  highlightCasesOnHomepage: false,
  highlightedCaseCtaCopy: "highlighted CTA",
  overdueOpportunityCalloutCopy: "overdue",
};

export const mockUsXxTwoOppConfig: OpportunityConfiguration = {
  ...mockUsXxOppConfig,
  priority: "NORMAL",
  label: "Mock Opportunity Two",

  systemType: "INCARCERATION",
  homepagePosition: 2,
};

export const MOCK_OPPORTUNITY_CONFIGS = {
  [mockUsXxOpp]: mockUsXxOppConfig,
  [mockUsXxTwoOpp]: mockUsXxTwoOppConfig,
};
