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
import nextSunday from "date-fns/nextSunday";
import simplur from "simplur";

import { ClientRecord } from "../../../FirestoreStore";
import { FeatureVariant, TenantId } from "../../../RootStore/types";
import { dateToTimestamp } from "../../utils";
import {
  OpportunityConfig,
  OpportunityConfigMap,
  OpportunityType,
} from "../OpportunityConfigs";
import {} from "../types";

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

export const mockUsXxOppConfig: OpportunityConfig = {
  stateCode: "US_XX" as TenantId,
  urlSection: "mockOpportunity",
  label: "Mock Opportunity",
  featureVariant: "usXxMockOpportunity" as FeatureVariant,
  initialHeader: "Mock initial header to search for something",
  customTabOrder: ["Eligible Now", "Missing Review Date", "Overridden"],
  snooze: {
    defaultSnoozeUntilFn: (snoozedOn: Date) => nextSunday(snoozedOn),
  },
  hydratedHeader: (count: number) => ({
    eligibilityText: simplur`${count} client[|s] may be `,
    opportunityText: "on or past their expiration date",
    callToAction:
      "Review these clients and complete their auto-generated TEPE Note.",
  }),
};

export const mockUsXxTwoOppConfig: OpportunityConfig = {
  ...mockUsXxOppConfig,
  hydratedHeader: (count: number) => ({
    fullText: simplur`${count} client[|s] may be `,
    opportunityText: "on or past their expiration date",
    callToAction:
      "Review these clients and complete their auto-generated TEPE Note.",
  }),
};

export const mockUsXxOpp: OpportunityType = "mockUsXxOpp" as OpportunityType;
export const mockUsXxTwoOpp: OpportunityType =
  "mockUsXxTwoOpp" as OpportunityType;

export const MOCK_OPPORTUNITY_CONFIGS = {
  [mockUsXxOpp]: mockUsXxOppConfig,
  [mockUsXxTwoOpp]: mockUsXxTwoOppConfig,
} as OpportunityConfigMap;
