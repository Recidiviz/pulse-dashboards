// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnInitialClassification2026ReferralRecord,
  usTnInitialClassification2026Schema,
} from "./schema";

export const usTnInitialClassification2026PolicyFixtures = {
  fullyEligible: makeRecordFixture(usTnInitialClassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      custodyLevelIsNotMax: null,
      notHasInitialClassificationInStatePrisonCustody: null,
    },
    ineligibleCriteria: {},
    formInformation: {
      calculatedTotalScore: 11,
      classificationType: "STUB",
      gangAffiliationId: "STUB",
      healthClassification: "STUB",
      lastCafDate: "2025-01-15",
      lastCafTotal: 10,
      latestClassificationDate: "2025-02-20",
      latestOverrideReason: null,
      latestVantageCompletedDate: "2025-01-10",
      latestVantageRiskLevel: "STUB",
      levelOfCare: "LVL1",
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q7Score: 1,
      sentenceEffectiveDate: "2024-12-01",
      sentenceExpirationDate: "2028-12-01",
      sentenceFullExpirationDate: "2029-12-01",
      sentenceReleaseEligibilityDate: "2027-06-01",
      sentenceSafetyValveDate: "2030-12-01",
      statusAtHearingSeg: null,
    },
  }),
  ineligible: makeRecordFixture(usTnInitialClassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: false,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {
      custodyLevelIsNotMax: {
        custodyLevel: "Maximum",
      },
      notHasInitialClassificationInStatePrisonCustody: {
        initialAssessmentDate: "2024-12-28",
        initialClassificationDate: "2025-01-01",
        initialClassificationDecisionDate: "2025-01-01",
      },
    },
    formInformation: {
      calculatedTotalScore: 11,
      classificationType: "STUB",
      gangAffiliationId: "STUB",
      healthClassification: "STUB",
      lastCafDate: "2025-01-15",
      lastCafTotal: 10,
      latestClassificationDate: "2025-02-20",
      latestOverrideReason: null,
      latestVantageCompletedDate: "2025-01-10",
      latestVantageRiskLevel: "STUB",
      levelOfCare: "LVL1",
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q7Score: 1,
      sentenceEffectiveDate: "2024-12-01",
      sentenceExpirationDate: "2028-12-01",
      sentenceFullExpirationDate: "2029-12-01",
      sentenceReleaseEligibilityDate: "2027-06-01",
      sentenceSafetyValveDate: "2030-12-01",
      statusAtHearingSeg: null,
    },
  }),
} satisfies FixtureMapping<UsTnInitialClassification2026ReferralRecord>;
