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

export const usNeOverrideModerateToLowReferrals =
  fixtureWithIdKey<UsNeSupervisionDowngradeSchemaReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_NE",
        externalId: "NE002",
        eligibleCriteria: {
          onParoleAtLeast6Months: {
            supervisionStartDate: relativeFixtureDate({ months: -15 }),
          },
          supervisionLevelIsMedium: {
            supervisionLevelRawText: "MEDIUM",
          },
          noTopThreeSeverityLevelSupervisionViolationWithin6Months: null,
          usNeCompliantWithSpecialConditions: null,
          notSupervisionWithin1MonthOfProjectedCompletionDateMinExternal: {
            projectedCompletionDate: relativeFixtureDate({ months: 8 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        metadata: {
          recentOrasScores: [
            {
              assessmentDate: relativeFixtureDate({ months: -2 }),
              assessmentLevel: "MODERATE",
            },
            {
              assessmentDate: relativeFixtureDate({ months: -8 }),
              assessmentLevel: "HIGH",
            },
          ],
          specialConditions: [
            {
              specialConditionType: "NO_CONTACT_CODEFENDANTS",
              compliance: "COMPLIANT",
            },
            {
              specialConditionType: "COMMUNITY_SERVICE",
              compliance: "PARTIALLY_COMPLIANT",
            },
          ],
        },
        caseNotes: {
          "Latest Case Plan Check-in": [
            {
              noteTitle: "Community Service Progress",
              noteBody: "Client has completed 40 hours of required 80 hours community service. Maintains dual employment with Lincoln Electric System and Weekend Auto Repair. No contact violations reported.",
              eventDate: relativeFixtureDate({ days: -12 }),
            },
            {
              noteTitle: "Employment Stability Review",
              noteBody: "Client successfully managing two employment positions. No issues reported by either employer. Shows strong work ethic and reliability.",
              eventDate: relativeFixtureDate({ days: -35 }),
            },
          ],
          "Special Conditions Monitoring": [
            {
              noteTitle: "No Contact Compliance",
              noteBody: "Verified no contact with co-defendants through regular monitoring. Client continues to comply with all no-contact requirements.",
              eventDate: relativeFixtureDate({ days: -8 }),
            },
          ],
        },
      },
      {
        stateCode: "US_NE",
        externalId: "NE004",
        eligibleCriteria: {
          onParoleAtLeast6Months: {
            supervisionStartDate: relativeFixtureDate({ months: -17 }),
          },
          supervisionLevelIsMedium: {
            supervisionLevelRawText: "MEDIUM",
          },
          noTopThreeSeverityLevelSupervisionViolationWithin6Months: null,
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
              assessmentDate: relativeFixtureDate({ months: -1 }),
              assessmentLevel: "MODERATE",
            },
            {
              assessmentDate: relativeFixtureDate({ months: -7 }),
              assessmentLevel: "MODERATE",
            },
          ],
          specialConditions: [
            {
              specialConditionType: "RANDOM_DRUG_TESTING",
              compliance: "COMPLIANT",
            },
            {
              specialConditionType: "MAINTAIN_STABLE_RESIDENCE",
              compliance: "COMPLIANT",
            },
            {
              specialConditionType: "ANGER_MANAGEMENT",
              compliance: "COMPLIANT",
            },
          ],
        },
        caseNotes: {
          "Latest Case Plan Check-in": [
            {
              noteTitle: "Special Conditions Compliance",
              noteBody: "Client passes all random drug tests. Maintains stable residence at North Platte location. Successfully completed anger management counseling program. Employment with Union Pacific Railroad remains stable.",
              eventDate: relativeFixtureDate({ days: -6 }),
            },
            {
              noteTitle: "Progress Assessment",
              noteBody: "Client shows continued improvement in behavior and compliance. No violations in past 6 months. Demonstrating strong commitment to rehabilitation.",
              eventDate: relativeFixtureDate({ days: -31 }),
            },
          ],
          "Employment Verification": [
            {
              noteTitle: "Employer Contact - Union Pacific",
              noteBody: "Contacted supervisor at Union Pacific Railroad. Client maintains good standing with company, reliable attendance, and satisfactory performance.",
              eventDate: relativeFixtureDate({ days: -18 }),
            },
          ],
        },
      },
    ],
  );
