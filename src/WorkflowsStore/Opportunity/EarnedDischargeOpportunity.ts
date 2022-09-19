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

import { computed, makeObservable } from "mobx";

import { Client } from "../Client";
import { OpportunityValidationError } from "../utils";
import { OTHER_KEY } from "../WorkflowsStore";
import { EarnedDischargeReferralRecord } from "./EarnedDischargeReferralRecord";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import { earnedDischargeOpportunityStatuses } from "./utils";

const DENIAL_REASONS_MAP = {
  SCNC: "Not compliant with special conditions",
  FFR:
    "Failure to make payments towards fines, fees, and restitution despite ability to pay",
  PCD: "Parole Commission permanently denied early discharge request",
  CD: "Court permanently denied early discharge request",
  [OTHER_KEY]: "Other, please specify a reason",
};

// This could be configured externally once it's fleshed out
// to include all copy and other static data
// TODO: Update the keys in this mapping once we know what the data looks like
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CRITERIA: Record<string, Partial<OpportunityRequirement>> = {
  minimumSentenceServed: {
    tooltip:
      "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
  },
  noNewOffenses: {
    text: "No new criminal activity while under supervision",
    tooltip:
      "A criminal records check through NCIC/ILETS indicates no new criminal activity while under supervision",
  },
  courtOrderConditionsMet: {
    text: "Compliant with all court-ordered conditions ",
    tooltip: `Compliant with all court-ordered conditions`,
  },
};

class EarnedDischargeOpportunity extends OpportunityBase<EarnedDischargeReferralRecord> {
  constructor(client: Client) {
    super(client, "earnedDischarge");

    makeObservable(this, {
      statusMessageShort: computed,
      statusMessageLong: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get statusMessageShort(): string {
    return earnedDischargeOpportunityStatuses[this.reviewStatus];
  }

  get statusMessageLong(): string {
    // TODO #2141 Update status message once denial reason is added to the client update record
    return earnedDischargeOpportunityStatuses[this.reviewStatus];
  }
}

/**
 * Returns an `EarnedDischargeOpportunity` if the provided data indicates the client is eligible
 */
export function createEarnedDischargeOpportunity(
  eligible: boolean | undefined,
  client: Client
): EarnedDischargeOpportunity | undefined {
  if (!eligible) return undefined;
  try {
    return new EarnedDischargeOpportunity(client);
  } catch (e) {
    // constructor performs further validation that may fail
    if (e instanceof OpportunityValidationError) {
      return undefined;
    }
    // don't handle anything unexpected, it's probably a bug!
    throw e;
  }
}
