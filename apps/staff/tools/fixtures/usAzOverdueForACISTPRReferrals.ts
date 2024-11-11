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

import { UsAzOverdueForAcisTprReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisTprOpportunity/UsAzOverdueForAcisTprReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usAzOverdueForACISTPRReferrals =
  fixtureWithIdKey<UsAzOverdueForAcisTprReferralRecordRaw>("externalId", [
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES005",
      eligibleCriteria: {
        usAzIncarcerationPastAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: -15 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -12 }),
            noteTitle: "Return to CC Supervisor",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES006",
      eligibleCriteria: {
        usAzIncarcerationPastAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: -23 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -7 }),
            noteTitle: "Home Plan Cancelled",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES009",
      eligibleCriteria: {
        usAzIncarcerationPastAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: -5 }),
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
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES010",
      eligibleCriteria: {
        usAzIncarcerationPastAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: -41 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -34 }),
            noteTitle: "Home Plan In Progress",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES011",
      eligibleCriteria: {
        usAzIncarcerationPastAcisTprDate: {
          acisTprDate: relativeFixtureDate({ days: -2 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Cancelled",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
