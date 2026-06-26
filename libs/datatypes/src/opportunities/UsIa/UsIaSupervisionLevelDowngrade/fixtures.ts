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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsIaSupervisionLevelDowngradeRecord,
  usIaSupervisionLevelDowngradeSchema,
} from "./schema";

export const usIaSupervisionLevelDowngradeFixtures = {
  fullyEligible: makeRecordFixture(usIaSupervisionLevelDowngradeSchema, {
    stateCode: "US_IA",
    externalId: "001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      noSupervisionLevelDowngradeWithin6Months: null,
      noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
      notServingALifeSentenceOnSupervision: null,
      notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ years: 4, months: 7 }),
      },
      supervisionCaseTypeIsNotSexOffense: null,
      supervisionLevelIsMediumOrMinimum: {
        supervisionLevel: "MEDIUM",
        supervisionLevelStartDate: relativeFixtureDate({
          years: -4,
          months: -4,
        }),
      },
      supervisionLevelIsNotResidentialProgram: null,
      supervisionTypeIsNotInvestigation: null,
      usIaNoOpenSupervisionModifiers: null,
      usIaNotEligibleOrMarkedIneligibleForEarlyDischarge: {
        edDenialReasons: null,
        edEligibilityDate: null,
        edMarkedIneligibleDate: null,
      },
      usIaNotServingIneligibleOffenseForEarlyDischarge: null,
      usIaServingSupervisionCaseAtLeast90Days: {
        supervisionCaseStartDate: relativeFixtureDate({
          years: -6,
          months: -10,
        }),
        eligibleDate: relativeFixtureDate({ years: -3, months: -10 }),
      },
    },
    ineligibleCriteria: {},
    formInformation: {},
    metadata: {
      openInterventionsFlag: false,
      violationsPast6MonthsFlag: false,
    },
  }),
  almostEligible: makeRecordFixture(usIaSupervisionLevelDowngradeSchema, {
    stateCode: "US_IA",
    externalId: "003",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {
      noSupervisionLevelDowngradeWithin6Months: null,
      noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
      notServingALifeSentenceOnSupervision: null,
      notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ months: 2 }),
      },
      supervisionCaseTypeIsNotSexOffense: null,
      supervisionLevelIsMediumOrMinimum: {
        supervisionLevel: "MINIMUM",
        supervisionLevelStartDate: relativeFixtureDate({
          years: -1,
          months: -2,
        }),
      },
      supervisionLevelIsNotResidentialProgram: null,
      supervisionTypeIsNotInvestigation: null,
      usIaNoOpenSupervisionModifiers: null,
      usIaNotServingIneligibleOffenseForEarlyDischarge: null,
      usIaServingSupervisionCaseAtLeast90Days: {
        supervisionCaseStartDate: relativeFixtureDate({
          years: -2,
          months: -10,
        }),
        eligibleDate: relativeFixtureDate({ months: 8 }),
      },
    },
    ineligibleCriteria: {
      usIaNotEligibleOrMarkedIneligibleForEarlyDischarge: {
        edDenialReasons: null,
        edEligibilityDate: relativeFixtureDate({ years: -1, months: -1 }),
        edMarkedIneligibleDate: null,
      },
    },
    formInformation: {},
    metadata: {
      openInterventionsFlag: true,
      violationsPast6MonthsFlag: true,
    },
  }),
} satisfies FixtureMapping<UsIaSupervisionLevelDowngradeRecord>;
