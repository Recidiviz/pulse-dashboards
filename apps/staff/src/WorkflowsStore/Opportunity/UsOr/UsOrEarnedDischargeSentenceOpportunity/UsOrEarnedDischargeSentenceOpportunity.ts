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

import { DocumentData } from "@google-cloud/firestore";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsOrEarnedDischargeSentenceReferralRecord,
  usOrEarnedDischargeSentenceSchema,
} from "./UsOrEarnedDischargeSentenceReferralRecord";

// =============================================================================
export class UsOrEarnedDischargeSentenceOpportunity extends OpportunityBase<
  Client,
  UsOrEarnedDischargeSentenceReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usOrEarnedDischargeSentence",
      client.rootStore,
      usOrEarnedDischargeSentenceSchema.parse(record),
    );
  }

  get instanceDetails() {
    const { courtCaseNumber, sentenceStatute } = this.record.metadata.sentence;
    return `${courtCaseNumber}: ${sentenceStatute}`;
  }

  get labelAddendum() {
    return ` • ${this.instanceDetails}`;
  }

  get sentenceStart() {
    return this.record.metadata.sentence.sentenceStartDate;
  }

  get sentenceExpiration() {
    return this.record.metadata.sentence.sentenceEndDate;
  }
}
