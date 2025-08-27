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

import { UsNeSupervisionDowngradeSchemaReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsNe";
import { fixtureWithIdKey } from "./utils";

export const usNeConditionalLowRiskOverrideReferrals =
  fixtureWithIdKey<UsNeSupervisionDowngradeSchemaReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_NE",
        externalId: "NE001",
        eligibleCriteria: {
          onParoleAtLeast6Months: {
            supervisionStartDate: relativeFixtureDate({ months: -18 }),
          },
          supervisionLevelIsMinimum: {
            supervisionLevelRawText: "MINIMUM",
          },
          noSupervisionViolationWithin6Months: null,
          usNeCompliantWithSpecialConditions: null,
          notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal: {
            projectedCompletionDate: relativeFixtureDate({ months: 6 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          recentOrasScores: [
            {
              assessmentDate: relativeFixtureDate({ months: -3 }),
              assessmentLevel: "LOW",
            },
            {
              assessmentDate: relativeFixtureDate({ months: -9 }),
              assessmentLevel: "MODERATE",
            },
          ],
          specialConditions: [
            {
              specialConditionType: "SUBSTANCE_ABUSE_TREATMENT",
              compliance: "YES",
            },
            {
              specialConditionType: "MAINTAIN_EMPLOYMENT",
              compliance: "YES",
            },
          ],
        },
        caseNotes: {
          "Latest Case Plan Check-in": [
            {
              noteTitle: "Case Plan Review",
              noteBody: "Client has successfully completed substance abuse treatment program. Employment status remains stable with Nebraska Medical Center. All special conditions are being met.",
              eventDate: relativeFixtureDate({ days: -5 }),
            },
            {
              noteTitle: "Progress Update", 
              noteBody: "Client continues to demonstrate positive progress. No violations reported. Discussed upcoming discharge planning.",
              eventDate: relativeFixtureDate({ days: -49 }),
            },
          ],
          "General Contact": [
            {
              noteTitle: "Home Visit",
              noteBody: "Conducted home visit - residence is stable and appropriate. Client was present and cooperative.",
              eventDate: relativeFixtureDate({ days: -10 }),
            },
          ],
        },
      },
      {
        stateCode: "US_NE",
        externalId: "NE003",
        eligibleCriteria: {
          onParoleAtLeast6Months: {
            supervisionStartDate: relativeFixtureDate({ months: -40 }),
          },
          supervisionLevelIsMinimum: {
            supervisionLevelRawText: "MINIMUM",
          },
          noSupervisionViolationWithin6Months: null,
          usNeCompliantWithSpecialConditions: null,
          notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal: {
            projectedCompletionDate: relativeFixtureDate({ months: 4 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          recentOrasScores: [
            {
              assessmentDate: relativeFixtureDate({ months: -2 }),
              assessmentLevel: "LOW",
            },
            {
              assessmentDate: relativeFixtureDate({ months: -8 }),
              assessmentLevel: "LOW",
            },
          ],
          specialConditions: [
            {
              specialConditionType: "MENTAL_HEALTH_COUNSELING",
              compliance: "YES",
            },
          ],
        },
        caseNotes: {
          "Latest Case Plan Check-in": [
            {
              noteTitle: "Mental Health Review",
              noteBody: "Client attended all scheduled mental health counseling sessions. Therapist reports good progress and engagement. Client demonstrates improved coping strategies.",
              eventDate: relativeFixtureDate({ days: -7 }),
            },
            {
              noteTitle: "Stability Assessment",
              noteBody: "Long-term supervision shows consistent compliance. Client has maintained stable housing and employment at Central Nebraska Community College.",
              eventDate: relativeFixtureDate({ days: -28 }),
            },
          ],
          "Employment Verification": [
            {
              noteTitle: "Employer Contact",
              noteBody: "Verified employment with Central Nebraska Community College. Supervisor reports excellent attendance and performance.",
              eventDate: relativeFixtureDate({ days: -14 }),
            },
          ],
        },
      },
      {
        stateCode: "US_NE",
        externalId: "NE005",
        eligibleCriteria: {
          onParoleAtLeast6Months: {
            supervisionStartDate: relativeFixtureDate({ months: -44 }),
          },
          supervisionLevelIsMinimum: {
            supervisionLevelRawText: "MINIMUM",
          },
          noSupervisionViolationWithin6Months: null,
          usNeCompliantWithSpecialConditions: null,
          notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal: {
            projectedCompletionDate: relativeFixtureDate({ months: -8 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          recentOrasScores: [
            {
              assessmentDate: relativeFixtureDate({ months: -1 }),
              assessmentLevel: "LOW",
            },
            {
              assessmentDate: relativeFixtureDate({ months: -6 }),
              assessmentLevel: "MODERATE",
            },
          ],
          specialConditions: [],
        },
        caseNotes: {
          "Latest Case Plan Check-in": [
            {
              noteTitle: "Long-term Success Review",
              noteBody: "Client has maintained compliance throughout supervision period. No special conditions currently required. Employment with Great Plains Health remains stable.",
              eventDate: relativeFixtureDate({ days: -3 }),
            },
          ],
          "General Contact": [
            {
              noteTitle: "Monthly Check-in",
              noteBody: "Client reports continued stability. Discussed upcoming supervision completion and discharge planning.",
              eventDate: relativeFixtureDate({ days: -30 }),
            },
          ],
        },
      },
    ],
  );
