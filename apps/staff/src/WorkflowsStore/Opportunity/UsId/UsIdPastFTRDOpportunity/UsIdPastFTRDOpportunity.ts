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

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { Client } from "../../../Client";
import { OTHER_KEY } from "../../../utils";
import { PastFTRDOpportunityBase } from "../../PastFTRDOpportunityBase";
import {
  UsIdPastFTRDReferralRecord,
  usIdPastFTRDSchema,
} from "./UsIdPastFTRDReferralRecord";

export class UsIdPastFTRDOpportunity extends PastFTRDOpportunityBase<UsIdPastFTRDReferralRecord> {
  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ID;

  constructor(client: Client) {
    super(client, "pastFTRD", usIdPastFTRDSchema.parse);
  }

  denialReasonsMap = {
    ABSCONDING: "Client is in absconder status",
    VIOLATION: "Client is in violation status",
    [OTHER_KEY]: "Other: please specify a reason",
  };
}
