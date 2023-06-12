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

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { PastFTRDOpportunityBase } from "./PastFTRDOpportunityBase";
import {
  UsMiPastFTRDReferralRecord,
  usMiPastFTRDSchema,
} from "./UsMiPastFTRDReferralRecord";

export class UsMiPastFTRDOpportunity extends PastFTRDOpportunityBase<UsMiPastFTRDReferralRecord> {
  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MI;

  constructor(client: Client) {
    super(client, "usMiPastFTRD", usMiPastFTRDSchema.parse);
  }

  denialReasonsMap = {
    DATE: "Expiration date is inaccurate",
    CUSTODY: "Client is currently in custody",
    [OTHER_KEY]: "Other: please specify a reason",
  };
}
