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

import { relativeFixtureDate } from "~datatypes";

import { UsIaSupervisionLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsIa";
import { fixtureWithIdKey } from "./utils";

export const usIaSupervisionLevelDowngradeReferralsFixture =
  fixtureWithIdKey<UsIaSupervisionLevelDowngradeReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_IA",
        externalId: "001",
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
        formInformation: {},
        ineligibleCriteria: {},
        isAlmostEligible: false,
        isEligible: true,
        metadata: {
          openInterventionsFlag: false,
          violationsPast6MonthsFlag: false,
        },
        reasonsV2: [
          {
            criteriaName: "NOT_SERVING_A_LIFE_SENTENCE_ON_SUPERVISION",
            reason: null,
          },
          {
            criteriaName:
              "NOT_SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE_OR_UPCOMING_30_DAYS",
            reason: {
              eligibleDate: relativeFixtureDate({ years: 4, months: 7 }),
            },
          },
          {
            criteriaName: "NO_SUPERVISION_LEVEL_DOWNGRADE_WITHIN_6_MONTHS",
            reason: null,
          },
          {
            criteriaName:
              "NO_SUPERVISION_VIOLATION_REPORT_WITHIN_6_MONTHS_USING_RESPONSE_DATE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_CASE_TYPE_IS_NOT_SEX_OFFENSE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_MEDIUM_OR_MINIMUM",
            reason: {
              supervisionLevel: "MINIMUM",
              supervisionLevelStartDate: relativeFixtureDate({
                years: -4,
                months: -4,
              }),
            },
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_NOT_RESIDENTIAL_PROGRAM",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_TYPE_IS_NOT_INVESTIGATION",
            reason: null,
          },
          {
            criteriaName:
              "US_IA_NOT_ELIGIBLE_OR_MARKED_INELIGIBLE_FOR_EARLY_DISCHARGE",
            reason: {
              edDenialReasons: null,
              edEligibilityDate: null,
              edMarkedIneligibleDate: null,
            },
          },
          {
            criteriaName:
              "US_IA_NOT_SERVING_INELIGIBLE_OFFENSE_FOR_EARLY_DISCHARGE",
            reason: null,
          },
          {
            criteriaName: "US_IA_NO_OPEN_SUPERVISION_MODIFIERS",
            reason: null,
          },
          {
            criteriaName: "US_IA_SERVING_SUPERVISION_CASE_AT_LEAST_90_DAYS",
            reason: {
              supervisionCaseStartDate: relativeFixtureDate({
                years: -6,
                months: -10,
              }),
            },
          },
        ],
      },
      {
        stateCode: "US_IA",
        externalId: "002",
        caseNotes: {
          "Open Interventions": [
            {
              eventDate: relativeFixtureDate({ years: -1, months: -6 }),
              noteBody: "In progress. Started on",
              noteTitle: "PERSON CARE",
            },
          ],
        },
        eligibleCriteria: {
          noSupervisionLevelDowngradeWithin6Months: null,
          noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
          notServingALifeSentenceOnSupervision: null,
          notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
            eligibleDate: relativeFixtureDate({ years: 6, months: 4 }),
          },
          supervisionCaseTypeIsNotSexOffense: null,
          supervisionLevelIsMediumOrMinimum: {
            supervisionLevel: "MINIMUM",
            supervisionLevelStartDate: relativeFixtureDate({ months: -6 }),
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
              years: -1,
              months: -7,
            }),
            eligibleDate: relativeFixtureDate({ months: -6 }),
          },
        },
        formInformation: {},
        ineligibleCriteria: {},
        isAlmostEligible: false,
        isEligible: true,
        metadata: {
          openInterventionsFlag: true,
          violationsPast6MonthsFlag: false,
        },
        reasonsV2: [
          {
            criteriaName: "NOT_SERVING_A_LIFE_SENTENCE_ON_SUPERVISION",
            reason: null,
          },
          {
            criteriaName:
              "NOT_SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE_OR_UPCOMING_30_DAYS",
            reason: {
              eligibleDate: relativeFixtureDate({ years: 6, months: 4 }),
            },
          },
          {
            criteriaName: "NO_SUPERVISION_LEVEL_DOWNGRADE_WITHIN_6_MONTHS",
            reason: null,
          },
          {
            criteriaName:
              "NO_SUPERVISION_VIOLATION_REPORT_WITHIN_6_MONTHS_USING_RESPONSE_DATE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_CASE_TYPE_IS_NOT_SEX_OFFENSE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_MEDIUM_OR_MINIMUM",
            reason: {
              supervisionLevel: "MINIMUM",
              supervisionLevelStartDate: relativeFixtureDate({ months: -6 }),
            },
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_NOT_RESIDENTIAL_PROGRAM",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_TYPE_IS_NOT_INVESTIGATION",
            reason: null,
          },
          {
            criteriaName:
              "US_IA_NOT_ELIGIBLE_OR_MARKED_INELIGIBLE_FOR_EARLY_DISCHARGE",
            reason: {
              edDenialReasons: null,
              edEligibilityDate: null,
              edMarkedIneligibleDate: null,
            },
          },
          {
            criteriaName:
              "US_IA_NOT_SERVING_INELIGIBLE_OFFENSE_FOR_EARLY_DISCHARGE",
            reason: null,
          },
          {
            criteriaName: "US_IA_NO_OPEN_SUPERVISION_MODIFIERS",
            reason: null,
          },
          {
            criteriaName: "US_IA_SERVING_SUPERVISION_CASE_AT_LEAST_90_DAYS",
            reason: {
              supervisionCaseStartDate: relativeFixtureDate({
                years: -1,
                months: -7,
              }),
            },
          },
        ],
      },
      {
        stateCode: "US_IA",
        externalId: "003",
        caseNotes: {
          "Open Interventions": [
            {
              eventDate: relativeFixtureDate({ years: -1, months: -7 }),
              noteBody: "In progress. Started on",
              noteTitle: "MENTAL HEALTH TREATMENT",
            },
          ],
          "Violation Incidents Dated Within the Past 6 Months": [
            {
              eventDate: relativeFixtureDate({ months: -1 }),
              noteBody:
                "The client calls and continues to move her appointments",
              noteTitle: "CONTACT AND APPOINTMENTS.",
            },
          ],
        },
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
        formInformation: {},
        ineligibleCriteria: {
          usIaNotEligibleOrMarkedIneligibleForEarlyDischarge: {
            edDenialReasons: null,
            edEligibilityDate: relativeFixtureDate({ years: -1, months: -1 }),
            edMarkedIneligibleDate: null,
          },
        },
        isAlmostEligible: true,
        isEligible: false,
        metadata: {
          openInterventionsFlag: true,
          violationsPast6MonthsFlag: true,
        },
        reasonsV2: [
          {
            criteriaName: "NOT_SERVING_A_LIFE_SENTENCE_ON_SUPERVISION",
            reason: null,
          },
          {
            criteriaName:
              "NOT_SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE_OR_UPCOMING_30_DAYS",
            reason: {
              eligibleDate: relativeFixtureDate({ months: 2 }),
            },
          },
          {
            criteriaName: "NO_SUPERVISION_LEVEL_DOWNGRADE_WITHIN_6_MONTHS",
            reason: null,
          },
          {
            criteriaName:
              "NO_SUPERVISION_VIOLATION_REPORT_WITHIN_6_MONTHS_USING_RESPONSE_DATE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_CASE_TYPE_IS_NOT_SEX_OFFENSE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_MEDIUM_OR_MINIMUM",
            reason: {
              supervisionLevel: "MINIMUM",
              supervisionLevelStartDate: relativeFixtureDate({
                years: -1,
                months: -2,
              }),
            },
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_NOT_RESIDENTIAL_PROGRAM",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_TYPE_IS_NOT_INVESTIGATION",
            reason: null,
          },
          {
            criteriaName:
              "US_IA_NOT_ELIGIBLE_OR_MARKED_INELIGIBLE_FOR_EARLY_DISCHARGE",
            reason: {
              edDenialReasons: null,
              edEligibilityDate: relativeFixtureDate({ years: -1, months: -1 }),
              edMarkedIneligibleDate: null,
            },
          },
          {
            criteriaName:
              "US_IA_NOT_SERVING_INELIGIBLE_OFFENSE_FOR_EARLY_DISCHARGE",
            reason: null,
          },
          {
            criteriaName: "US_IA_NO_OPEN_SUPERVISION_MODIFIERS",
            reason: null,
          },
          {
            criteriaName: "US_IA_SERVING_SUPERVISION_CASE_AT_LEAST_90_DAYS",
            reason: {
              supervisionCaseStartDate: relativeFixtureDate({
                years: -2,
                months: -10,
              }),
            },
          },
        ],
      },
      {
        stateCode: "US_IA",
        externalId: "004",
        caseNotes: {},
        eligibleCriteria: {
          noSupervisionLevelDowngradeWithin6Months: null,
          noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
          notServingALifeSentenceOnSupervision: null,
          notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
            eligibleDate: relativeFixtureDate({ years: 8 }),
          },
          supervisionCaseTypeIsNotSexOffense: null,
          supervisionLevelIsMediumOrMinimum: {
            supervisionLevel: "MINIMUM",
            supervisionLevelStartDate: relativeFixtureDate({ years: -2 }),
          },
          supervisionLevelIsNotResidentialProgram: null,
          supervisionTypeIsNotInvestigation: null,
          usIaNoOpenSupervisionModifiers: null,
          usIaNotServingIneligibleOffenseForEarlyDischarge: null,
          usIaServingSupervisionCaseAtLeast90Days: {
            supervisionCaseStartDate: relativeFixtureDate({ years: -2 }),
            eligibleDate: relativeFixtureDate({ months: -2 }),
          },
        },
        formInformation: {},
        ineligibleCriteria: {
          usIaNotEligibleOrMarkedIneligibleForEarlyDischarge: {
            edDenialReasons: null,
            edEligibilityDate: relativeFixtureDate({ months: -2 }),
            edMarkedIneligibleDate: null,
          },
        },
        isAlmostEligible: true,
        isEligible: false,
        metadata: {
          openInterventionsFlag: false,
          violationsPast6MonthsFlag: false,
        },
        reasonsV2: [
          {
            criteriaName: "NOT_SERVING_A_LIFE_SENTENCE_ON_SUPERVISION",
            reason: null,
          },
          {
            criteriaName:
              "NOT_SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE_OR_UPCOMING_30_DAYS",
            reason: {
              eligibleDate: relativeFixtureDate({ years: 8 }),
            },
          },
          {
            criteriaName: "NO_SUPERVISION_LEVEL_DOWNGRADE_WITHIN_6_MONTHS",
            reason: null,
          },
          {
            criteriaName:
              "NO_SUPERVISION_VIOLATION_REPORT_WITHIN_6_MONTHS_USING_RESPONSE_DATE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_CASE_TYPE_IS_NOT_SEX_OFFENSE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_MEDIUM_OR_MINIMUM",
            reason: {
              supervisionLevel: "MINIMUM",
              supervisionLevelStartDate: relativeFixtureDate({ years: -2 }),
            },
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_NOT_RESIDENTIAL_PROGRAM",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_TYPE_IS_NOT_INVESTIGATION",
            reason: null,
          },
          {
            criteriaName:
              "US_IA_NOT_ELIGIBLE_OR_MARKED_INELIGIBLE_FOR_EARLY_DISCHARGE",
            reason: {
              edDenialReasons: null,
              edEligibilityDate: relativeFixtureDate({ months: -2 }),
              edMarkedIneligibleDate: null,
            },
          },
          {
            criteriaName:
              "US_IA_NOT_SERVING_INELIGIBLE_OFFENSE_FOR_EARLY_DISCHARGE",
            reason: null,
          },
          {
            criteriaName: "US_IA_NO_OPEN_SUPERVISION_MODIFIERS",
            reason: null,
          },
          {
            criteriaName: "US_IA_SERVING_SUPERVISION_CASE_AT_LEAST_90_DAYS",
            reason: {
              supervisionCaseStartDate: relativeFixtureDate({ years: -2 }),
            },
          },
        ],
      },
      {
        stateCode: "US_IA",
        externalId: "005",
        isEligible: false,
        isAlmostEligible: true,
        eligibleDate: relativeFixtureDate({ months: -14 }),
        eligibleCriteria: {
          noSupervisionLevelDowngradeWithin6Months: null,
          noSupervisionViolationReportWithin6MonthsUsingResponseDate: null,
          notServingALifeSentenceOnSupervision: null,
          notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
            eligibleDate: relativeFixtureDate({ years: 1, months: 10 }),
          },
          supervisionCaseTypeIsNotSexOffense: null,
          supervisionLevelIsMediumOrMinimum: {
            supervisionLevel: "MEDIUM",
            supervisionLevelStartDate: relativeFixtureDate({ months: -5 }),
          },
          supervisionLevelIsNotResidentialProgram: null,
          supervisionTypeIsNotInvestigation: null,
          usIaNoOpenSupervisionModifiers: null,
          usIaNotServingIneligibleOffenseForEarlyDischarge: null,
          usIaServingSupervisionCaseAtLeast90Days: {
            supervisionCaseStartDate: relativeFixtureDate({
              years: -2,
              months: -2,
            }),
          },
        },
        ineligibleCriteria: {
          usIaNotEligibleOrMarkedIneligibleForEarlyDischarge: {
            edDenialReasons: null,
            edEligibilityDate: relativeFixtureDate({ years: -1, months: -5 }),
            edMarkedIneligibleDate: null,
          },
        },
        caseNotes: {
          "Violation Incidents Dated Within the Past 6 Months": [
            {
              eventDate: relativeFixtureDate({ months: 2 }),
              noteBody:
                "Urinalysis - Methamphetamine (Positive). Admitted to using methamphetamine on 6-1-25.",
              noteTitle: "DRUG VIOLATION",
            },
          ],
        },
        reasonsV2: [
          {
            criteriaName: "NOT_SERVING_A_LIFE_SENTENCE_ON_SUPERVISION",
            reason: null,
          },
          {
            criteriaName:
              "NOT_SUPERVISION_PAST_FULL_TERM_COMPLETION_DATE_OR_UPCOMING_30_DAYS",
            reason: {
              eligibleDate: relativeFixtureDate({ years: 1, months: 10 }),
            },
          },
          {
            criteriaName: "NO_SUPERVISION_LEVEL_DOWNGRADE_WITHIN_6_MONTHS",
            reason: null,
          },
          {
            criteriaName:
              "NO_SUPERVISION_VIOLATION_REPORT_WITHIN_6_MONTHS_USING_RESPONSE_DATE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_CASE_TYPE_IS_NOT_SEX_OFFENSE",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_MEDIUM_OR_MINIMUM",
            reason: {
              supervisionLevel: "MEDIUM",
              supervisionLevelStartDate: relativeFixtureDate({ months: -5 }),
            },
          },
          {
            criteriaName: "SUPERVISION_LEVEL_IS_NOT_RESIDENTIAL_PROGRAM",
            reason: null,
          },
          {
            criteriaName: "SUPERVISION_TYPE_IS_NOT_INVESTIGATION",
            reason: null,
          },
          {
            criteriaName:
              "US_IA_NOT_ELIGIBLE_OR_MARKED_INELIGIBLE_FOR_EARLY_DISCHARGE",
            reason: {
              edDenialReasons: null,
              edEligibilityDate: relativeFixtureDate({ years: -1, months: -5 }),
              edMarkedIneligibleDate: null,
            },
          },
          {
            criteriaName:
              "US_IA_NOT_SERVING_INELIGIBLE_OFFENSE_FOR_EARLY_DISCHARGE",
            reason: null,
          },
          {
            criteriaName: "US_IA_NO_OPEN_SUPERVISION_MODIFIERS",
            reason: null,
          },
          {
            criteriaName: "US_IA_SERVING_SUPERVISION_CASE_AT_LEAST_90_DAYS",
            reason: {
              supervisionCaseStartDate: relativeFixtureDate({
                years: -2,
                months: -2,
              }),
            },
          },
        ],
      },
    ],
  );
