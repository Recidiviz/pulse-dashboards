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

import { UsTxAnnualReportStatusV2ReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTx/UsTxAnnualReportStatusV2Opportunity/UsTxAnnualReportStatusV2OpportunityReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usTxAnnualReportStatusV2ReferralsFixture =
  fixtureWithIdKey<UsTxAnnualReportStatusV2ReferralRecordRaw>("externalId", [
    // ── Eligible Now ─────────────────────────────────────────────────────────
    {
      externalId: "002",
      stateCode: "US_TX",
      eligibleDate: "2023-11-19",
      eligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2023-11-19",
          supervisionLevelStart: "2020-11-19",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2020-05-19",
        },
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
            noteTitle: "Annual compliance review",
            noteBody:
              "Client has maintained consistent employment and housing stability throughout the supervision period. No missed check-ins in the past 18 months.",
            eventDate: "2026-04-15",
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
      eligibleDate: "2023-11-19",
      eligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2023-11-19",
          supervisionLevelStart: "2020-11-19",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2020-05-19",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "8652174",
        unitSupervisor: "TORRES CARMEN V",
        paroleSupervisor: "NGUYEN JAMES T",
        assistantRegionDirector: "WALKER SAMUEL E",
        regionDirector: "MARTINEZ DIANA L",
      },
      caseNotes: {},
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
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2025-06-15",
          supervisionLevelStart: "2022-06-15",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2022-01-15",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "3891042",
        unitSupervisor: "TORRES CARMEN V",
        paroleSupervisor: "NGUYEN JAMES T",
        assistantRegionDirector: "WALKER SAMUEL E",
        regionDirector: "MARTINEZ DIANA L",
      },
      caseNotes: {},
      isEligible: true,
      isAlmostEligible: false,
      metadata: {
        personId: "003",
        stateCode: "US_TX",
      },
    },
    {
      // ARS-eligible only — not in ERS fixture (minimum supervision, meets ARS case-type requirement)
      externalId: "006",
      stateCode: "US_TX",
      eligibleDate: "2025-08-30",
      eligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2025-08-30",
          supervisionLevelStart: "2022-08-30",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2022-01-01",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "2948173",
        unitSupervisor: "HERNANDEZ ANTONIO J",
        paroleSupervisor: "CLARK RACHEL S",
        assistantRegionDirector: "PATEL ANITA K",
        regionDirector: "HENDERSON MARCUS B",
      },
      caseNotes: {},
      isEligible: true,
      isAlmostEligible: false,
      metadata: {
        personId: "006",
        stateCode: "US_TX",
      },
    },
    {
      externalId: "009",
      stateCode: "US_TX",
      eligibleDate: "2024-05-07",
      eligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2024-05-07",
          supervisionLevelStart: "2021-05-07",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2020-12-01",
        },
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
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2024-03-04",
          supervisionLevelStart: "2021-03-04",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "ANNUAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2021-01-01",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "1538274",
        unitSupervisor: "JOHNSON MICHAEL L",
        paroleSupervisor: "RODRIGUEZ LISA M",
        assistantRegionDirector: "CHEN DAVID R",
        regionDirector: "WASHINGTON PATRICIA A",
      },
      caseNotes: {},
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
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2024-04-08",
          supervisionLevelStart: "2021-04-08",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2021-02-01",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "7402938",
        unitSupervisor: "TORRES CARMEN V",
        paroleSupervisor: "NGUYEN JAMES T",
        assistantRegionDirector: "WALKER SAMUEL E",
        regionDirector: "MARTINEZ DIANA L",
      },
      caseNotes: {},
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
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2023-07-03",
          supervisionLevelStart: "2020-07-03",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2020-03-01",
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        tdcjNumber: "1029384",
        unitSupervisor: "HERNANDEZ ANTONIO J",
        paroleSupervisor: "CLARK RACHEL S",
        assistantRegionDirector: "PATEL ANITA K",
        regionDirector: "HENDERSON MARCUS B",
      },
      caseNotes: {},
      isEligible: true,
      isAlmostEligible: false,
      metadata: {
        personId: "008",
        stateCode: "US_TX",
      },
    },
    // ── Approved by Supervisor ────────────────────────────────────────────────
    {
      externalId: "018",
      stateCode: "US_TX",
      eligibleDate: "2024-07-30",
      eligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2024-07-30",
          supervisionLevelStart: "2021-07-30",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2021-03-01",
        },
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
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2024-12-28",
          supervisionLevelStart: "2021-12-28",
        },
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2021-06-01",
        },
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
    // ── Almost Eligible ───────────────────────────────────────────────────────
    {
      externalId: "005",
      stateCode: "US_TX",
      eligibleCriteria: {
        usTxNoWarrantWithSustainedViolationWithin2Years: null,
      },
      ineligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2026-07-15",
          supervisionLevelStart: "2023-07-15",
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
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
      },
      ineligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2026-10-13",
          supervisionLevelStart: "2023-10-13",
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
        usTxCaseTypeEligibleForArsErs: {
          caseType: "GENERAL",
        },
        usTxNotSupervisionWithin6MonthsOfReleaseDate: {
          fullTermCompletionDate: "2020-09-30",
        },
      },
      ineligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
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
      },
      ineligibleCriteria: {
        supervisionLevelIsMinimumFor3Years: {
          eligibleDate: "2026-08-12",
          supervisionLevelStart: "2023-08-12",
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
  ]);
