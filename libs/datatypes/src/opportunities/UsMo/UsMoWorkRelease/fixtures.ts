// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { UsMoWorkReleaseReferralRecord, usMoWorkReleaseSchema } from "./schema";

export const usMoWorkReleaseFixtures: FixtureMapping<UsMoWorkReleaseReferralRecord> =
  {
    eligible: makeRecordFixture(usMoWorkReleaseSchema, {
      stateCode: "US_MO",
      externalId: "RES019",
      eligibleCriteria: {
        usMoMentalHealthScore3OrBelowWhileIncarcerated: {},
        usMoInstitutionalRiskScore1WhileIncarcerated: {},
        usMoMeetsTimeRemainingRequirementsWorkRelease: {},
        usMoNoEscapeIn10YearsOrCurrentSentence: {},
        noContrabandIncarcerationIncidentWithin2Years: {},
      },
      ineligibleCriteria: {},
      formInformation: {
        historyEscapesAbsconsions: [
          { eventDate: "2017-08-12", eventType: "ABSCONSION (SUPERVISION)" },
        ],
        historyViolationsLast24Months: [
          { violationCode: "D1-02", violationDate: "2024-09-01" },
        ],
      },
      metadata: {
        currentC3Sanctions: [],
      },
      isEligible: true,
      isAlmostEligible: false,
    }),
  };
