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

import { LSUReferralRecordRaw } from "../../src/WorkflowsStore";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const LSUReferralsFixture: FirestoreFixture<LSUReferralRecordRaw> = {
  data: [
    {
      externalId: "001",
      stateCode: "US_ID",
      eligibleStartDate: "2022-04-28",
      formInformation: {
        chargeDescriptions: [
          "BURGLARY",
          "BURGLARY",
          "POSSESSION OF A CONTROLLED SUBSTANCE",
        ],
        caseNumbers: ["12AB", "45BF", "89RE"],
        currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
        assessmentDate: "2022-03-03",
        assessmentScore: "25",
        employerName: "RECIDIVIZ",
        employerAddress: "456 FAKE ST, TWIN FALLS, ID, 99999-9876",
        employmentStartDate: "2022-03-03T00:00:00",
        employmentDateVerified: "2022-03-03T00:00:00",
        latestNegativeDrugScreenDate: "2022-03-02",
      },
      ineligibleCriteria: {},
      eligibleCriteria: {
        negativeDaWithin90Days: {
          latestUaDates: ["2022-09-08"],
          latestUaResults: [false],
        },
        noFelonyWithin24Months: null,
        usIdIncomeVerifiedWithin3Months: {
          incomeVerifiedDate: "2022-10-13",
        },
        usIdNoActiveNco: {
          activeNco: false,
        },
        usIdLsirLevelLowFor90Days: {
          eligibleDate: "2021-02-15",
          riskLevel: "LOW",
        },
        onSupervisionAtLeastOneYear: {
          eligibleDate: "2021-10-16",
        },
      },
      caseNotes: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      externalId: "005",
      stateCode: "US_ID",
      eligibleStartDate: "2022-04-28",
      formInformation: {
        chargeDescriptions: [
          "BURGLARY",
          "BURGLARY",
          "POSSESSION OF A CONTROLLED SUBSTANCE",
        ],
        caseNumbers: ["12AB", "45BF", "89RE"],
        currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
        assessmentDate: "2022-03-03",
        assessmentScore: "25",
        employerName: "RECIDIVIZ",
        employerAddress: "456 FAKE ST, TWIN FALLS, ID, 99999-9876",
        employmentStartDate: "2022-03-03T00:00:00",
        employmentDateVerified: "2022-03-03T00:00:00",
        latestNegativeDrugScreenDate: "2022-03-02",
      },
      ineligibleCriteria: {
        onSupervisionAtLeastOneYear: {
          eligibleDate: "2025-10-16",
        },
      },
      eligibleCriteria: {
        negativeDaWithin90Days: {
          latestUaDates: ["2022-09-08"],
          latestUaResults: [false],
        },
        noFelonyWithin24Months: null,
        usIdIncomeVerifiedWithin3Months: {
          incomeVerifiedDate: "2022-10-13",
        },
        usIdNoActiveNco: {
          activeNco: false,
        },
        usIdLsirLevelLowFor90Days: {
          eligibleDate: "2021-02-15",
          riskLevel: "LOW",
        },
      },
      caseNotes: {},
      isEligible: false,
      isAlmostEligible: true,
    },
    {
      externalId: "006",
      stateCode: "US_ID",
      eligibleStartDate: "2022-04-28",
      formInformation: {
        chargeDescriptions: [
          "BURGLARY",
          "BURGLARY",
          "POSSESSION OF A CONTROLLED SUBSTANCE",
        ],
        currentAddress: "123 FAKE ST, TWIN FALLS, ID, 99999-9876",
        assessmentDate: "2022-03-03",
        assessmentScore: "25",
        employerName: "RECIDIVIZ",
        employerAddress: "456 FAKE ST, TWIN FALLS, ID, 99999-9876",
        employmentStartDate: "2022-03-03T00:00:00",
        employmentDateVerified: "2022-03-03T00:00:00",
        latestNegativeDrugScreenDate: "2022-03-02",
      },
      ineligibleCriteria: {
        usIdIncomeVerifiedWithin3Months: null,
      },
      eligibleCriteria: {
        noFelonyWithin24Months: null,
        usIdNoActiveNco: {
          activeNco: false,
        },
        usIdLsirLevelLowFor90Days: {
          eligibleDate: "2021-02-15",
          riskLevel: "LOW",
        },
        onSupervisionAtLeastOneYear: {
          eligibleDate: "2021-10-16",
        },
      },
      caseNotes: {},
      isEligible: false,
      isAlmostEligible: true,
    },
  ],
  idFunc: externalIdFunc,
};
