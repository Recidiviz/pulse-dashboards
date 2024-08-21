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

import { UsOrEarnedDischargeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsOr/UsOrEarnedDischargeOpportunity/UsOrEarnedDischargeReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usOrEarnedDischargeReferrals =
  fixtureWithIdKey<UsOrEarnedDischargeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_OR",
      externalId: "001",
      eligibleCriteria: {
        usOrSentenceEligible: {
          eligibleSentences: [
            {
              sentenceId: 123,
              sentenceImposedDate: "2020-01-01",
              supervisionSentenceStartDate: "2020-01-01",
              numDaysAbsconsion: 0,
              sentenceStatute: "STATUTE",
              latestConvictionDate: "2020-01-01",
            },
            {
              sentenceId: 456,
              sentenceImposedDate: "2020-01-01",
              supervisionSentenceStartDate: "2020-01-01",
              numDaysAbsconsion: 0,
              sentenceStatute: "STATUTE",
              latestConvictionDate: "2020-01-01",
            },
          ],
        },
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {},
      metadata: {
        programs: [],
        eligibleSentences: [
          {
            sentenceId: 123,
            courtCaseNumber: "cc1",
            sentenceSubType: "subtype",
            sentenceImposedDate: "2020-01-01",
            sentenceStartDate: "2020-01-01",
            sentenceEndDate: "2020-01-01",
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Reinhold",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
          {
            sentenceId: 456,
            courtCaseNumber: "cc2",
            sentenceSubType: "subtype",
            sentenceImposedDate: "2020-01-01",
            sentenceStartDate: "2020-01-01",
            sentenceEndDate: "2020-01-01",
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Reinhold",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
        ],
      },
    },
    {
      stateCode: "US_OR",
      externalId: "002",
      eligibleCriteria: {
        usOrSentenceEligible: {
          eligibleSentences: [
            {
              sentenceId: 1123,
              sentenceImposedDate: "2020-01-01",
              supervisionSentenceStartDate: "2020-01-01",
              numDaysAbsconsion: 0,
              sentenceStatute: "STATUTE",
              latestConvictionDate: "2020-01-01",
            },
            {
              sentenceId: 4456,
              sentenceImposedDate: "2020-01-01",
              supervisionSentenceStartDate: "2020-01-01",
              numDaysAbsconsion: 0,
              sentenceStatute: "STATUTE",
              latestConvictionDate: "2020-01-01",
            },
          ],
        },
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {},
      metadata: {
        programs: [],
        eligibleSentences: [
          {
            sentenceId: 1123,
            courtCaseNumber: "cc1",
            sentenceSubType: "subtype",
            sentenceImposedDate: "2020-01-01",
            sentenceStartDate: "2020-01-01",
            sentenceEndDate: "2020-01-01",
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Reinhold",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
          {
            sentenceId: 4456,
            courtCaseNumber: "cc2",
            sentenceSubType: "subtype",
            sentenceImposedDate: "2020-01-01",
            sentenceStartDate: "2020-01-01",
            sentenceEndDate: "2020-01-01",
            sentenceCounty: "COUNTY",
            chargeCounty: "CHARGE COUNTY",
            judgeFullName: "Judge Reinhold",
            sentenceStatute: "STATUTE",
            conditions: [],
          },
        ],
      },
    },
  ]);
