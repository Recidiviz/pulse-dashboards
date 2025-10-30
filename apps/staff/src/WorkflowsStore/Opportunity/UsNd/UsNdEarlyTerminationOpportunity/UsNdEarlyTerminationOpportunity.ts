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

import { differenceInDays, startOfToday } from "date-fns";
import { DocumentData } from "firebase/firestore";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { EarlyTerminationForm } from "../../Forms/EarlyTerminationForm";
import { OpportunityBase } from "../../OpportunityBase";
import { FormVariant } from "../../types";
import {
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationReferralRecord,
  usNdEarlyTerminationSchema,
} from "./UsNdEarlyTerminationReferralRecord";

export class UsNdEarlyTerminationOpportunity extends OpportunityBase<
  Client,
  UsNdEarlyTerminationReferralRecord,
  OpportunityUpdateWithForm<UsNdEarlyTerminationDraftData>
> {
  form: EarlyTerminationForm;

  readonly denialConfirmationModalName = "DocstarsDenialModal";

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "earlyTermination",
      client.rootStore,
      usNdEarlyTerminationSchema.parse(record),
    );

    this.form = new EarlyTerminationForm(this, client.rootStore);
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible || !this.record) return;
    const { ineligibleCriteria } = this.record;

    if (ineligibleCriteria.supervisionPastEarlyDischargeDate?.eligibleDate) {
      return `Early termination date (as calculated by DOCSTARS) is within 60 days`;
    }
  }

  get formVariant(): FormVariant | undefined {
    if (!this.record) return undefined;

    const {
      eligibleCriteria: { usNdImpliedValidEarlyTerminationSentenceType },
    } = this.record;

    if (
      usNdImpliedValidEarlyTerminationSentenceType?.supervisionType ===
      "DEFERRED"
    ) {
      return "deferred";
    }
  }

  get metadata(): UsNdEarlyTerminationReferralRecord["metadata"] | undefined {
    return this.record?.metadata;
  }

  // The snooze expiration date has to be capped at the expiration date of the
  // sentence that can be Early Terminated. This date might differ from someone's
  // overall supervision expiration date if they have multiple sentences and one of
  // the sentences cannot be Early Terminated (i.e., a Parole sentence).
  maxManualSnoozeDays(selectedReasons: string[]): number | undefined {
    const today = startOfToday();

    // Sentence expiration dates should always be in the future. If that is
    // somehow not the case, default to the client record expiration date or today.
    const { probationExpirationDate } = this.record.formInformation;
    const backupDate = this.person.expirationDate ?? today;
    const expirationDate =
      probationExpirationDate < today ? backupDate : probationExpirationDate;

    const manualSnoozeDays = super.maxManualSnoozeDays(selectedReasons);
    const daysToSentenceExpiration = differenceInDays(expirationDate, today);
    return Math.min(
      daysToSentenceExpiration,
      // If the maxManualSnoozeDays are undefined (reasons allow indefinite snooze),
      // we should still limit the snooze expiration date til sentence expiration.
      manualSnoozeDays === undefined ? Infinity : manualSnoozeDays,
    );
  }
}
