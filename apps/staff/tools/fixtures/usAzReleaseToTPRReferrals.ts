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

import { relativeFixtureDate } from "~datatypes";

import { UsAzReleaseToTPRReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsAz/UsAzReleaseToTPROpportunity/UsAzReleaseToTPRReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usAzReleaseToTPRReferrals =
  fixtureWithIdKey<UsAzReleaseToTPRReferralRecordRaw>("externalId", [
    // Eligible - Fast Tracker
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES001",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoAcisDtpOrTprDateSet: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzNoActiveFelonyDetainers: null,
        usAzMeetsFunctionalLiteracyTpr: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: 5 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabDescription: "FAST_TRACK",
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    // Eligible - Approved by Time Comp
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES002",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoAcisDtpOrTprDateSet: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzNoActiveFelonyDetainers: null,
        usAzMeetsFunctionalLiteracyTpr: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: 50 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabDescription: "APPROVED_BY_TIME_COMP",
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    // Almost Eligible - Missing functional literacy requirement, within 6 months
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES003",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoAcisDtpOrTprDateSet: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzNoActiveFelonyDetainers: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: 27 }),
        },
      },
      ineligibleCriteria: {
        usAzMeetsFunctionalLiteracyTpr: null,
      },
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabName: "ALMOST_ELIGIBLE_1",
        tabDescription: "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    // Almost Eligible - No missing criteria, 6+ months away
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES004",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoAcisDtpOrTprDateSet: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzMeetsFunctionalLiteracyTpr: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: 300 }),
        },
      },
      ineligibleCriteria: {
        usAzNoActiveFelonyDetainers: null,
      },
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabName: "ALMOST_ELIGIBLE_2",
        tabDescription:
          "ALMOST_ELIGIBLE_MISSING_CRITERIA_AND_BETWEEN_181_AND_365_DAYS",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    // Ineligible - Both ACIS and Recidiviz date criteria
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES021",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzNoActiveFelonyDetainers: null,
        usAzMeetsFunctionalLiteracyTpr: null,
      },
      ineligibleCriteria: {
        usAzWithin7DaysOfRecidivizTprDate: {
          recidivizTprDate: relativeFixtureDate({ days: 45 }),
        },
        usAzNoAcisDtpOrTprDateSet: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: null,
      },
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabName: "ALMOST_ELIGIBLE_1",
        tabDescription: "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    // Ineligible - Only ACIS date criteria
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES022",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
        usAzNoActiveFelonyDetainers: null,
        usAzMeetsFunctionalLiteracyTpr: null,
      },
      ineligibleCriteria: {
        usAzWithin7DaysOfRecidivizTprDate: {
          recidivizTprDate: relativeFixtureDate({ days: 60 }),
        },
        usAzNoAcisDtpOrTprDateSet: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: null,
      },
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabName: "ALMOST_ELIGIBLE_1",
        tabDescription: "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    // Ineligible - Only Recidiviz date criteria
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES023",
      eligibleCriteria: {
        usAzNoSexualArsonOrDangerousCrimesAgainstChildren: null,
        custodyLevelIsMinimumOrMedium: null,
        usAzNoUnsatisfactoryProgramRatingsWithin3Months: null,
        usAzNoViolationsAndEligibleLegalStatus: null,
        usAzNoAcisDtpOrTprDateSet: null,
        usAzNoViolentConvictionUnlessAssaultOrAggravatedAssaultOrRobberyConviction:
          null,
        usAzNoTprDenialOrReleaseInCurrentIncarceration: null,
        usAzNotServingFlatSentence: null,
        usAzNoTprRemovalsFromSelfImprovementPrograms: null,
        usAzAtLeast24MonthsSinceLastCsed: null,
        usAzNoActiveFelonyDetainers: null,
        usAzMeetsFunctionalLiteracyTpr: null,
        usAzIncarcerationWithin6MonthsOfAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: 75 }),
        },
      },
      ineligibleCriteria: {
        usAzWithin7DaysOfRecidivizTprDate: {
          recidivizTprDate: relativeFixtureDate({ days: 75 }),
        },
        usAzEligibleOrAlmostEligibleForOverdueForRecidivizDtp: null,
      },
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Not Started",
          },
        ],
      },
      metadata: {
        tabName: "ALMOST_ELIGIBLE_1",
        tabDescription: "ALMOST_ELIGIBLE_MISSING_MANLIT_BETWEEN_7_AND_180_DAYS",
      },
      isEligible: false,
      isAlmostEligible: true,
    },
  ]);
