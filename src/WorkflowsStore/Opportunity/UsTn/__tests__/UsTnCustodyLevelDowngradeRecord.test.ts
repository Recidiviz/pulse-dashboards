// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  UsTnCustodyLevelDowngradeReferralRecordRaw,
  usTnCustodyLevelDowngradeSchema,
} from "../UsTnCustodyLevelDowngradeOpportunity/UsTnCustodyLevelDowngradeReferralRecord";

const usTnCustodyLevelDowngradeRecordRaw: UsTnCustodyLevelDowngradeReferralRecordRaw =
  {
    stateCode: "US_XX",
    externalId: "abc123",
    eligibleCriteria: {
      custodyLevelHigherThanRecommended: {
        recommendedCustodyLevel: "HIGH",
        custodyLevel: "MAXIMUM",
      },
      custodyLevelIsNotMax: null,
      // TODO(#3969): [Workflows][US_TN] Remove old SLD criteria after deprecation
      usTnAtLeast6MonthsSinceMostRecentIncarcerationIncident: null,
      usTnHasHadAtLeast1IncarcerationIncidentPastYear: {
        latestIncarcerationIncidentDate: "2022-04-12",
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      q1Score: 1,
      q2Score: 1,
      q3Score: 1,
      q4Score: 1,
      q5Score: 1,
      q6Score: 1,
      q7Score: 1,
      q8Score: 1,
      q9Score: 1,
    },
  };

const usTnCustodyLevelDowngradeRecordRawNew: UsTnCustodyLevelDowngradeReferralRecordRaw =
  {
    ...usTnCustodyLevelDowngradeRecordRaw,
    eligibleCriteria: {
      custodyLevelHigherThanRecommended:
        usTnCustodyLevelDowngradeRecordRaw.eligibleCriteria
          .custodyLevelHigherThanRecommended,
      custodyLevelIsNotMax:
        usTnCustodyLevelDowngradeRecordRaw.eligibleCriteria
          .custodyLevelIsNotMax,
      usTnLatestAssessmentNotOverride: null,
      usTnIneligibleForAnnualReclassification: {
        mostRecentAssessmentDate: "2022-02-22",
      },
    },
  };

const usTnCustodyLevelDowngradeRecordRawCombined: UsTnCustodyLevelDowngradeReferralRecordRaw =
  {
    ...usTnCustodyLevelDowngradeRecordRaw,
    eligibleCriteria: {
      ...usTnCustodyLevelDowngradeRecordRaw.eligibleCriteria,
      usTnLatestAssessmentNotOverride: null,
      usTnIneligibleForAnnualReclassification: {
        mostRecentAssessmentDate: "2022-02-22",
      },
    },
  };

test("transforms the old opportunity format", () => {
  expect(
    usTnCustodyLevelDowngradeSchema.parse(usTnCustodyLevelDowngradeRecordRawNew)
  ).toMatchSnapshot();
});

test("transforms the new opportunity format", () => {
  expect(
    usTnCustodyLevelDowngradeSchema.parse(usTnCustodyLevelDowngradeRecordRaw)
  ).toMatchSnapshot();
});

test("transforms the combined opportunity format while preferring new keys", () => {
  const parsedRecord = usTnCustodyLevelDowngradeSchema.parse(
    usTnCustodyLevelDowngradeRecordRawCombined
  );
  expect(parsedRecord).toMatchSnapshot();

  expect(parsedRecord.eligibleCriteria).toContainAllKeys([
    "usTnIneligibleForAnnualReclassification",
    "custodyLevelHigherThanRecommended",
    "custodyLevelIsNotMax",
    "usTnLatestAssessmentNotOverride",
  ]);

  expect(parsedRecord.eligibleCriteria).not.toContainAnyKeys([
    "usTnAtLeast6MonthsSinceMostRecentIncarcerationIncident",
    "usTnHasHadAtLeast1IncarcerationIncidentPastYear",
  ]);
});
