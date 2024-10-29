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

import { UsAzReleaseToTPRReferralRecord } from "../../src/WorkflowsStore/Opportunity/UsAz/UsAzReleaseToTPRReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usAzReleaseToTPRReferrals =
  fixtureWithIdKey<UsAzReleaseToTPRReferralRecord>("externalId", [
    // Eligible - Fast Tracker
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES001",
      eligibleCriteria: {
        usAzTime90DaysBeforeRelease: null,
        usAzNoSexualOffenseConviction: null,
        usAzNoArsonConviction: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoActiveFelonyDetainers: null,
        custodyLevelIsMinimumOrMedium: null,
        noNonviolentIncarcerationViolationWithin6Months: null,
        usAzNoMajorViolentViolationDuringIncarceration: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzIsUsCitizenOrLegalPermanentResident: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoDangerousCrimesAgainstChildrenConviction: null,
        usAzMeetsFunctionalLiteracy: null,
        usAzNoTprDenialInCurrentIncarceration: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
      },
      ineligibleCriteria: {},
      caseNotes: {},
      metadata: {
        tabDescription: "FAST_TRACK",
      },
    },
    // Eligible - Approved by Time Comp
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES002",
      eligibleCriteria: {
        usAzTime90DaysBeforeRelease: null,
        usAzNoSexualOffenseConviction: null,
        usAzNoArsonConviction: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoActiveFelonyDetainers: null,
        custodyLevelIsMinimumOrMedium: null,
        noNonviolentIncarcerationViolationWithin6Months: null,
        usAzNoMajorViolentViolationDuringIncarceration: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzIsUsCitizenOrLegalPermanentResident: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoDangerousCrimesAgainstChildrenConviction: null,
        usAzMeetsFunctionalLiteracy: null,
        usAzNoTprDenialInCurrentIncarceration: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
      },
      ineligibleCriteria: {},
      caseNotes: {},
      metadata: {
        tabDescription: "APPROVED_BY_TIME_COMP",
      },
    },
    // Almost Eligible - Missing functional literacy requirement, within 6 months
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES003",
      eligibleCriteria: {
        usAzTime90DaysBeforeRelease: null,
        usAzNoSexualOffenseConviction: null,
        usAzNoArsonConviction: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoActiveFelonyDetainers: null,
        custodyLevelIsMinimumOrMedium: null,
        noNonviolentIncarcerationViolationWithin6Months: null,
        usAzNoMajorViolentViolationDuringIncarceration: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzIsUsCitizenOrLegalPermanentResident: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoDangerousCrimesAgainstChildrenConviction: null,
        usAzNoTprDenialInCurrentIncarceration: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
      },
      ineligibleCriteria: {
        usAzMeetsFunctionalLiteracy: null,
      },
      caseNotes: {},
      metadata: {
        tabName: "ALMOST_ELIGIBLE_1",
        tabDescription: "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS",
      },
    },
    // Almost Eligible - Missing criteria and 6+ months away
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES004",
      eligibleCriteria: {
        usAzTime90DaysBeforeRelease: null,
        usAzNoSexualOffenseConviction: null,
        usAzNoArsonConviction: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        custodyLevelIsMinimumOrMedium: null,
        noNonviolentIncarcerationViolationWithin6Months: null,
        usAzNoMajorViolentViolationDuringIncarceration: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzIsUsCitizenOrLegalPermanentResident: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoDangerousCrimesAgainstChildrenConviction: null,
        usAzMeetsFunctionalLiteracy: null,
        usAzNoTprDenialInCurrentIncarceration: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
      },
      ineligibleCriteria: {
        usAzNoActiveFelonyDetainers: null,
      },
      caseNotes: {},
      metadata: {
        tabName: "ALMOST_ELIGIBLE_2",
        tabDescription:
          "ALMOST_ELIGIBLE_MISSING_CRITERIA_AND_BETWEEN_181_AND_365_DAYS",
      },
    },
  ]);
