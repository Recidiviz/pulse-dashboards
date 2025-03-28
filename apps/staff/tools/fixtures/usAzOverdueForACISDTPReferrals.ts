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

import { UsAzOverdueForAcisDtpReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsAz/UsAzOverdueForAcisDtpOpportunity/UsAzOverdueForAcisDtpReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usAzOverdueForACISDTPReferrals =
  fixtureWithIdKey<UsAzOverdueForAcisDtpReferralRecordRaw>("externalId", [
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES007",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: relativeFixtureDate({ days: -50 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -40 }),
            noteTitle: "Return to CO III",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES008",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: relativeFixtureDate({ days: -9 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Approved",
            noteBody: "Request to release as homeless",
          },
        ],
        "Agreement Form Signature Status": [
          {
            eventDate: relativeFixtureDate({ days: -182 }),
            noteTitle: "Declined 180+ Days Ago",
          },
        ],
        "Mandatory Literacy Enrollment Information": [
          {
            eventDate: relativeFixtureDate({ days: -10 }),
            noteTitle: "Currently Enrolled",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES012",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: relativeFixtureDate({ days: -10 }),
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
      externalId: "AZ_RES013",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: relativeFixtureDate({ days: -21 }),
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Home Plan Information": [
          {
            eventDate: relativeFixtureDate({ days: -1 }),
            noteTitle: "Home Plan Approved",
          },
        ],
      },
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
