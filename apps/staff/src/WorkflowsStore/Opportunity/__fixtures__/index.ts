// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { ClientRecord } from "../../../FirestoreStore";
import { FeatureVariant, TenantId } from "../../../RootStore/types";
import { JusticeInvolvedPerson } from "../../types";
import { dateToTimestamp } from "../../utils";
import { OpportunityBase } from "../OpportunityBase";
import { OpportunityConfig } from "../OpportunityConfigs";
import { OpportunityConfiguration } from "../OpportunityConfigurations";
import { OpportunityType } from "../OpportunityType/types";
import { Opportunity } from "../types";

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
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: [],
  personType: "CLIENT",
};

export const mockUsXxOpp: OpportunityType = "mockUsXxOpp" as OpportunityType;
export const mockUsXxTwoOpp: OpportunityType =
  "mockUsXxTwoOpp" as OpportunityType;

export class TestOpportunity<
  T extends JusticeInvolvedPerson,
> extends OpportunityBase<T, any, any> {
  constructor(...[person, type, rootStore, ...args]: any[]) {
    super(person, type, rootStore, ...args);
  }
}

export const mockUsXxOppConfig: OpportunityConfiguration = {
  priority: "HIGH",
  tabGroups: { "ELIGIBILITY STATUS": [] },
  eligibilityTextForCount: (count: number) => "cool",
  eligibleCriteriaCopy: {},
  ineligibleCriteriaCopy: {},
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
};

export const mockUsXxTwoOppConfig: OpportunityConfiguration = {
  ...mockUsXxOppConfig,
  systemType: "INCARCERATION",
};

export const MOCK_OPPORTUNITY_CONFIGS = {
  [mockUsXxOpp]: mockUsXxOppConfig,
  [mockUsXxTwoOpp]: mockUsXxTwoOppConfig,
} as unknown as Record<OpportunityType, OpportunityConfig<Opportunity>>;
