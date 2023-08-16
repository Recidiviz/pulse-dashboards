// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
// =============================================================================import { ClientRecord, ResidentRecord } from "../../../FirestoreStore";
import { ClientRecord } from "../../../FirestoreStore";
import { dateToTimestamp } from "../../utils";
import { SupervisionTaskRecord } from "../types";

export const supervisionTaskClientRecord: ClientRecord = {
  personType: "CLIENT",
  recordId: "us_xx_102",
  personName: { givenNames: "REBEKAH", surname: "CORTES" },
  personExternalId: "102",
  displayId: "d102",
  pseudonymizedId: "p102",
  stateCode: "US_XX",
  officerId: "OFFICER1",
  supervisionType: "MISDEMEANOR PROBATIONER",
  supervisionLevel: "STANDARD: MINIMUM",
  supervisionLevelStart: dateToTimestamp("2021-07-05"),
  address: "123 Main St, Nashville, TN 12345",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  currentBalance: 221.88,
  specialConditions: ["EXAMPLE OF SPECIAL CONDITIONS HERE"],
  allEligibleOpportunities: ["LSU"],
  currentEmployers: [
    {
      name: "Photography Studio",
      address: "392 Telegraph Drive, Nashville, TN 12345",
    },
  ],
  milestones: [
    {
      text: "8 months without a violation",
      type: "MONTHS_WITHOUT_VIOLATION",
    },
    {
      text: "15 months on supervision",
      type: "MONTHS_ON_SUPERVISION",
    },
  ],
};

export const homeVisitTaskRecord: SupervisionTaskRecord<"homeVisit"> = {
  type: "homeVisit",
  details: {
    supervisionLevel: "MEDIUM",
    currentAddress: "123 Aloha rd.",
    lastHomeVisit: "2023-01-02",
  },
  dueDate: "2023-03-04",
};
