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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "./schema";

export const usTnReclassification2026PolicyFixtures = {
  fullyEligible: makeRecordFixture(usTnReclassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      custodyLevelIsNotMax: null,
      usTnAtLeast12MonthsSinceLatestAssessment: {
        initialAssessmentDate: "2024-12-28",
        AnnualReclassificationDate: "2025-01-01",
        AnnualReclassificationDecisionDate: "2025-01-01",
      },
    },
    ineligibleCriteria: {},
    formInformation: {
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q7Score: 1,
      q1Notes: {
        listPriorNonTdocConvictions60Months: [
          {
            description: "some offense",
            imposedDate: "2022-12-01",
          },
        ],
        listPriorViolentTdocConvictions60Months: [
          {
            description: "some other offense",
            imposedDate: "2021-08-22",
          },
        ],
      },
      q2Notes: ["a third offense"],
      q3Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "0-60Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "ABC",
            },
          ],
        },
      ],
    },
  }),
  ineligible: makeRecordFixture(usTnReclassification2026Schema, {
    stateCode: "US_TN",
    externalId: "RES003",
    isEligible: false,
    isAlmostEligible: false,
    eligibleCriteria: {},
    ineligibleCriteria: {
      custodyLevelIsNotMax: {
        custodyLevel: "Maximum",
      },
      usTnAtLeast12MonthsSinceLatestAssessment: {
        initialAssessmentDate: "2024-12-28",
        AnnualReclassificationDate: "2025-01-01",
        AnnualReclassificationDecisionDate: "2025-01-01",
      },
    },
    formInformation: {
      q1Score: 2,
      q2Score: 10,
      q3Score: -3,
      q4Score: 2,
      q5Score: -1,
      q6Score: 0,
      q7Score: 1,
      q1Notes: {
        listPriorNonTdocConvictions60Months: [
          {
            description: "some offense",
            imposedDate: "2022-12-01",
          },
        ],
        listPriorViolentTdocConvictions60Months: [
          {
            description: "some other offense",
            imposedDate: "2021-08-22",
          },
        ],
      },
      q2Notes: ["a third offense", "a fourth offense"],
      q3Notes: [
        {
          numIncidents: 2,
          incidentTimePeriod: "0-6Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "ABC",
            },
            {
              incidentDate: "2022-02-11",
              incidentTypeCode: "XYZ",
            },
          ],
        },
        {
          numIncidents: 2,
          incidentTimePeriod: "24-48Months",
          incidents: [
            {
              incidentDate: "2021-01-08",
              incidentTypeCode: "RFV",
            },
            {
              incidentDate: "2020-02-11",
              incidentTypeCode: "IKM",
            },
          ],
        },
      ],
      q4Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "6-12Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "DEF",
            },
          ],
        },
      ],
      q5Notes: [
        {
          numIncidents: 1,
          incidentTimePeriod: "12-24Months",
          incidents: [
            {
              incidentDate: "2023-01-08",
              incidentTypeCode: "HIJ",
            },
          ],
        },
      ],
    },
  }),
} satisfies FixtureMapping<UsTnReclassification2026ReferralRecord>;
