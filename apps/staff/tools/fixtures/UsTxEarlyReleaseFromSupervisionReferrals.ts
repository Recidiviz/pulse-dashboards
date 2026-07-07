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

import { UsTxEarlyReleaseFromSupervisionReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTx/UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usTxEarlyReleaseFromSupervisionReferralsFixture =
  fixtureWithIdKey<UsTxEarlyReleaseFromSupervisionReferralRecordRaw>(
    "externalId",
    [
      // ── Eligible Now ───────────────────────────────────────────────────────
      {
        externalId: "002",
        stateCode: "US_TX",
        eligibleDate: "2023-11-19",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2023-11-19",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2023-11-19",
            supervisionLevelStart: "2020-11-19",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "7419283",
          unitSupervisor: "JOHNSON MICHAEL L",
          paroleSupervisor: "RODRIGUEZ LISA M",
          assistantRegionDirector: "CHEN DAVID R",
          regionDirector: "WASHINGTON PATRICIA A",
        },
        caseNotes: {
          "Supervision Notes": [
            {
              noteTitle: "Semi-annual compliance review",
              noteBody:
                "Client has demonstrated consistent employment, stable housing, and good faith efforts on all fee obligations. No missed check-ins in the past 24 months.",
              eventDate: "2026-04-15",
            },
          ],
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody:
                "Amount assessed: $1,020.00 | Balance remaining: $221.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $846.00 | Balance remaining: $421.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$21.00",
              eventDate: "2026-06-03",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$5.00",
              eventDate: "2026-06-03",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$20.00",
              eventDate: "2026-05-29",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$5.00",
              eventDate: "2026-05-27",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "002",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "013",
        stateCode: "US_TX",
        eligibleDate: "2024-01-02",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-01-02",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-01-02",
            supervisionLevelStart: "2021-01-02",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "8652174",
          unitSupervisor: "TORRES CARMEN V",
          paroleSupervisor: "NGUYEN JAMES T",
          assistantRegionDirector: "WALKER SAMUEL E",
          regionDirector: "MARTINEZ DIANA L",
        },
        caseNotes: {
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody: "Amount assessed: $580.00 | Balance remaining: $490.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $300.00 | Balance remaining: $185.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$30.00",
              eventDate: "2026-06-10",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$15.00",
              eventDate: "2026-06-10",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$30.00",
              eventDate: "2026-05-12",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "0013",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "003",
        stateCode: "US_TX",
        eligibleDate: "2025-06-15",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2025-06-15",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2025-06-15",
            supervisionLevelStart: "2022-06-15",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "3891042",
          unitSupervisor: "TORRES CARMEN V",
          paroleSupervisor: "NGUYEN JAMES T",
          assistantRegionDirector: "WALKER SAMUEL E",
          regionDirector: "MARTINEZ DIANA L",
        },
        caseNotes: {
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody: "Amount assessed: $750.00 | Balance remaining: $0.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $500.00 | Balance remaining: $100.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$25.00",
              eventDate: "2026-06-15",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$50.00",
              eventDate: "2026-06-15",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$25.00",
              eventDate: "2026-05-15",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$50.00",
              eventDate: "2026-05-15",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "003",
          stateCode: "US_TX",
        },
      },
      {
        // ERS-eligible only — not in ARS fixture (limited supervision qualifies for ERS
        // minimum-or-limited criterion but not the ARS minimum-only criterion)
        externalId: "014",
        stateCode: "US_TX",
        eligibleDate: "2024-02-23",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-02-23",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-02-23",
            supervisionLevelStart: "2021-02-23",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "6284019",
          unitSupervisor: "MARTINEZ ELENA P",
          paroleSupervisor: "WILLIAMS DAVID C",
          assistantRegionDirector: "JONES BARBARA T",
          regionDirector: "HARRIS WILLIAM R",
        },
        caseNotes: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "014",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "009",
        stateCode: "US_TX",
        eligibleDate: "2024-05-07",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-05-07",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-05-07",
            supervisionLevelStart: "2021-05-07",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "9184302",
          unitSupervisor: "JACKSON ROBERT K",
          paroleSupervisor: "GARCIA LINDA M",
          assistantRegionDirector: "THOMPSON CHARLES P",
          regionDirector: "ROBINSON ANGELA J",
        },
        caseNotes: {
          "Supervision Notes": [
            {
              noteTitle: "Quarterly check-in",
              noteBody:
                "Client continues to meet all supervision conditions. Employment verified with current employer.",
              eventDate: "2026-03-20",
            },
          ],
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody:
                "Amount assessed: $1,200.00 | Balance remaining: $450.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody:
                "Amount assessed: $1,000.00 | Balance remaining: $750.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$50.00",
              eventDate: "2026-06-20",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$25.00",
              eventDate: "2026-06-20",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$50.00",
              eventDate: "2026-05-20",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "009",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "015",
        stateCode: "US_TX",
        eligibleDate: "2024-03-04",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-03-04",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-03-04",
            supervisionLevelStart: "2021-03-04",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "1538274",
          unitSupervisor: "JOHNSON MICHAEL L",
          paroleSupervisor: "RODRIGUEZ LISA M",
          assistantRegionDirector: "CHEN DAVID R",
          regionDirector: "WASHINGTON PATRICIA A",
        },
        caseNotes: {
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody: "Amount assessed: $400.00 | Balance remaining: $25.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $250.00 | Balance remaining: $0.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$25.00",
              eventDate: "2026-06-04",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$10.00",
              eventDate: "2026-06-04",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "015",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "016",
        stateCode: "US_TX",
        eligibleDate: "2024-04-08",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-04-08",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-04-08",
            supervisionLevelStart: "2021-04-08",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "7402938",
          unitSupervisor: "TORRES CARMEN V",
          paroleSupervisor: "NGUYEN JAMES T",
          assistantRegionDirector: "WALKER SAMUEL E",
          regionDirector: "MARTINEZ DIANA L",
        },
        caseNotes: {
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody: "Amount assessed: $900.00 | Balance remaining: $650.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $600.00 | Balance remaining: $600.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$75.00",
              eventDate: "2026-06-01",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$75.00",
              eventDate: "2026-05-01",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "016",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "008",
        stateCode: "US_TX",
        eligibleDate: "2023-07-03",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2023-07-03",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2023-07-03",
            supervisionLevelStart: "2020-07-03",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "1029384",
          unitSupervisor: "HERNANDEZ ANTONIO J",
          paroleSupervisor: "CLARK RACHEL S",
          assistantRegionDirector: "PATEL ANITA K",
          regionDirector: "HENDERSON MARCUS B",
        },
        caseNotes: {
          "Current Fees": [
            {
              noteTitle: "Supervision",
              noteBody: "Amount assessed: $680.00 | Balance remaining: $320.00",
              eventDate: "2026-06-30",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "Amount assessed: $450.00 | Balance remaining: $200.00",
              eventDate: "2026-06-30",
            },
          ],
          "Most Recent Payments": [
            {
              noteTitle: "Supervision",
              noteBody: "$40.00",
              eventDate: "2026-06-18",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$20.00",
              eventDate: "2026-06-18",
            },
            {
              noteTitle: "Supervision",
              noteBody: "$40.00",
              eventDate: "2026-05-20",
            },
            {
              noteTitle: "Crime Victim Fund",
              noteBody: "$20.00",
              eventDate: "2026-05-18",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "008",
          stateCode: "US_TX",
        },
      },
      // ── Approved by Supervisor ──────────────────────────────────────────────
      {
        externalId: "018",
        stateCode: "US_TX",
        eligibleDate: "2024-07-30",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-07-30",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-07-30",
            supervisionLevelStart: "2021-07-30",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "2748193",
          unitSupervisor: "JACKSON ROBERT K",
          paroleSupervisor: "GARCIA LINDA M",
          assistantRegionDirector: "THOMPSON CHARLES P",
          regionDirector: "ROBINSON ANGELA J",
        },
        caseNotes: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "018",
          stateCode: "US_TX",
          grantedAt: "2026-01-15",
        },
      },
      {
        externalId: "007",
        stateCode: "US_TX",
        eligibleDate: "2024-12-28",
        eligibleCriteria: {
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-12-28",
          },
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2024-12-28",
            supervisionLevelStart: "2021-12-28",
          },
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {},
        formInformation: {
          tdcjNumber: "6173829",
          unitSupervisor: "HERNANDEZ ANTONIO J",
          paroleSupervisor: "CLARK RACHEL S",
          assistantRegionDirector: "PATEL ANITA K",
          regionDirector: "HENDERSON MARCUS B",
        },
        caseNotes: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          personId: "007",
          stateCode: "US_TX",
          grantedAt: "2026-05-20",
        },
      },
      // ── Almost Eligible ────────────────────────────────────────────────────
      {
        externalId: "005",
        stateCode: "US_TX",
        eligibleCriteria: {
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2026-07-15",
            supervisionLevelStart: "2023-07-15",
          },
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2026-09-01",
          },
        },
        formInformation: {
          tdcjNumber: "5983716",
          unitSupervisor: "HERNANDEZ ANTONIO J",
          paroleSupervisor: "CLARK RACHEL S",
          assistantRegionDirector: "PATEL ANITA K",
          regionDirector: "HENDERSON MARCUS B",
        },
        caseNotes: {},
        isEligible: false,
        isAlmostEligible: true,
        metadata: {
          personId: "005",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "010",
        stateCode: "US_TX",
        eligibleCriteria: {
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2026-10-13",
            supervisionLevelStart: "2023-10-13",
          },
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2026-12-01",
          },
        },
        formInformation: {
          tdcjNumber: "5823719",
          unitSupervisor: "JACKSON ROBERT K",
          paroleSupervisor: "GARCIA LINDA M",
          assistantRegionDirector: "THOMPSON CHARLES P",
          regionDirector: "ROBINSON ANGELA J",
        },
        caseNotes: {},
        isEligible: false,
        isAlmostEligible: true,
        metadata: {
          personId: "010",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "011",
        stateCode: "US_TX",
        eligibleCriteria: {
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2024-03-19",
          },
        },
        ineligibleCriteria: {
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2026-09-19",
            supervisionLevelStart: "2023-09-19",
          },
        },
        formInformation: {
          tdcjNumber: "3047281",
          unitSupervisor: "JACKSON ROBERT K",
          paroleSupervisor: "GARCIA LINDA M",
          assistantRegionDirector: "THOMPSON CHARLES P",
          regionDirector: "ROBINSON ANGELA J",
        },
        caseNotes: {},
        isEligible: false,
        isAlmostEligible: true,
        metadata: {
          personId: "011",
          stateCode: "US_TX",
        },
      },
      {
        externalId: "012",
        stateCode: "US_TX",
        eligibleCriteria: {
          usTxNoWarrantWithSustainedViolationWithin2Years: null,
          noSupervisionSustainedViolationWithin2Years: null,
        },
        ineligibleCriteria: {
          supervisionLevelIsMinimumOrLimitedFor3Years: {
            eligibleDate: "2026-08-12",
            supervisionLevelStart: "2023-08-12",
          },
          usTxServedAtLeastHalfOfRemainingSupervisionSentence: {
            eligibleDate: "2026-09-30",
          },
        },
        formInformation: {
          tdcjNumber: "8391470",
          unitSupervisor: "MARTINEZ ELENA P",
          paroleSupervisor: "WILLIAMS DAVID C",
          assistantRegionDirector: "JONES BARBARA T",
          regionDirector: "HARRIS WILLIAM R",
        },
        caseNotes: {},
        isEligible: false,
        isAlmostEligible: true,
        metadata: {
          personId: "012",
          stateCode: "US_TX",
        },
      },
    ],
  );
