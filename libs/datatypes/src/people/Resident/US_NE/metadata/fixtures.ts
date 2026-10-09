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

import { relativeFixtureMonth } from "../../../../utils/zod";
import { RawUsNeResidentCommon } from "./schema";

const baseCreditActivity = [
  {
    creditsEarned: 3,
    isRestorable: null,
    violationDescription: null,
    violationCount: null,
    actionDate: relativeFixtureMonth({ months: -5 }, "start"),
    violationCode: null,
    creditType: "BEHAVIOR",
    lastModifiedDate: relativeFixtureMonth({ months: -5 }, "start"),
    misconductReportNumber: null,
    creditDate: relativeFixtureMonth({ months: -5 }, "start"),
  },
  {
    actionDate: relativeFixtureMonth({ months: -4 }, "start"),
    creditDate: relativeFixtureMonth({ months: -4 }, "start"),
    isRestorable: null,
    lastModifiedDate: relativeFixtureMonth({ months: -4 }, "start"),
    creditsEarned: 3,
    misconductReportNumber: null,
    violationCount: null,
    creditType: "BEHAVIOR",
    violationDescription: null,
    violationCode: null,
  },
  {
    actionDate: relativeFixtureMonth({ months: -3 }, "start"),
    lastModifiedDate: relativeFixtureMonth({ months: -3 }, "start"),
    violationCount: null,
    creditType: "BEHAVIOR",
    violationCode: null,
    misconductReportNumber: null,
    creditDate: relativeFixtureMonth({ months: -3 }, "start"),
    isRestorable: null,
    violationDescription: null,
    creditsEarned: 3,
  },
  {
    violationCode: null,
    violationCount: null,
    lastModifiedDate: relativeFixtureMonth({ months: -2 }, "start"),
    violationDescription: null,
    isRestorable: null,
    actionDate: relativeFixtureMonth({ months: -2 }, "start"),
    misconductReportNumber: null,
    creditDate: relativeFixtureMonth({ months: -2 }, "start"),
    creditType: "BEHAVIOR",
    creditsEarned: 3,
  },
  {
    misconductReportNumber: null,
    isRestorable: null,
    creditType: "BEHAVIOR",
    violationCount: null,
    violationCode: null,
    creditDate: relativeFixtureMonth({ months: -1 }, "start"),
    actionDate: relativeFixtureMonth({ months: -1 }, "start"),
    lastModifiedDate: relativeFixtureMonth({ months: -1 }, "start"),
    violationDescription: null,
    creditsEarned: 3,
  },
  {
    violationCount: null,
    creditDate: relativeFixtureMonth({}, "start"),
    lastModifiedDate: relativeFixtureMonth({}, "start"),
    misconductReportNumber: null,
    actionDate: relativeFixtureMonth({}, "start"),
    creditType: "BEHAVIOR",
    violationDescription: null,
    isRestorable: null,
    creditsEarned: 3,
    violationCode: null,
  },
];

// Fields used by both JII and workflows products.
export const usNeResidentCommonDataFixtures: RawUsNeResidentCommon[] = [
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 45,
    creditActivity: baseCreditActivity,
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 25,
    creditActivity: baseCreditActivity,
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 245,
    creditActivity: baseCreditActivity,
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 120,
    creditActivity: baseCreditActivity,
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 85,
    creditActivity: [
      ...baseCreditActivity,
      {
        creditsEarned: -15,
        isRestorable: "Y",
        violationDescription: "DISOBEYING A DIRECT ORDER",
        violationCount: "1",
        actionDate: relativeFixtureMonth({ months: -4, days: -15 }, "start"),
        violationCode: "IDC-301",
        creditType: "VIOLATION",
        lastModifiedDate: relativeFixtureMonth(
          { months: -4, days: -15 },
          "start",
        ),
        misconductReportNumber: "MR-2024-105",
        creditDate: relativeFixtureMonth({ months: -4, days: -15 }, "start"),
      },
    ],
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 160,
    creditActivity: [
      ...baseCreditActivity,
      {
        creditsEarned: -90,
        isRestorable: "Y",
        violationDescription: "AGGREV ASSULT/ASSULT/FIGHTING",
        violationCount: "1",
        actionDate: relativeFixtureMonth({ months: -10, days: -10 }, "start"),
        violationCode: "CLASS1-201",
        creditType: "VIOLATION",
        lastModifiedDate: relativeFixtureMonth(
          { months: -10, days: -10 },
          "start",
        ),
        misconductReportNumber: "MR-2024-078",
        creditDate: relativeFixtureMonth({ months: -10, days: -10 }, "start"),
      },
    ],
  },
  {
    stateCode: "US_NE",
    goodTimeLostDaysRestorable: 65,
    creditActivity: baseCreditActivity,
  },
];

// NE has no workflows-only fields; alias satisfies naming convention used by other three-tier states.
export const usNeResidentMetadataFixtures = [...usNeResidentCommonDataFixtures];
