// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY, without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { Timestamp } from "@google-cloud/firestore";
import { Timestamp as FirebaseTimestamp } from "firebase/firestore";

import { MilestonesMessage } from "../../src/FirestoreStore";

const updated = {
  by: "officer1@test.com",
  date: Timestamp.now() as FirebaseTimestamp,
};
const milestonesMessages: (MilestonesMessage & { externalId: string })[] = [
  {
    externalId: "us_ca_001",
    updated,
    status: "SUCCESS",
    messageDetails: {
      message: "testing offline message!",
      recipient: "1112223333",
      mid: "992b2e4c-9jkd98",
      stateCode: "US_CA",
      updated,
    },
  },
  {
    externalId: "us_ca_002",
    updated,
    status: "DECLINED",
    declinedReasons: {
      reasons: ["MILESTONE_NOT_MET"],
      updated,
    },
  },
  {
    externalId: "us_ca_006",
    updated,
    status: "FAILURE",
    errors: ["Phone number does not exist."],
    messageDetails: {
      message: "failed testing offline message!",
      recipient: "1112223333",
      mid: "992b2e4c-9jkd98",
      stateCode: "US_CA",
      updated,
    },
  },
];

export const clientUpdatesV2Data = {
  milestonesMessages,
};
