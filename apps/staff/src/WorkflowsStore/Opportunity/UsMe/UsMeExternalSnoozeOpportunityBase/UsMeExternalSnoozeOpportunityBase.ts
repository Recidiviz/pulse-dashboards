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

import { differenceInDays, formatISO, isAfter, startOfToday } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { z } from "zod";

import { usMeDenialMetadataSchema } from "~datatypes";

import {
  Denial,
  ManualSnoozeUpdate,
  OpportunityUpdate,
  OpportunityUpdateWithForm,
} from "../../../../FirestoreStore";
import { JusticeInvolvedPerson } from "../../../types";
import { OpportunityBase } from "../../OpportunityBase";

type MetadataDenial = z.infer<typeof usMeDenialMetadataSchema>;

type UsMeExternalSnoozeReferralRecord = {
  metadata: { denial?: MetadataDenial };
};

export class UsMeExternalSnoozeOpportunityBase<
  PersonType extends JusticeInvolvedPerson,
  ReferralRecord extends UsMeExternalSnoozeReferralRecord,
  UpdateRecord extends OpportunityUpdateWithForm<any> = OpportunityUpdate,
> extends OpportunityBase<PersonType, ReferralRecord, UpdateRecord> {
  readonly denialConfirmationModalName = "DenialCaseNoteModal";

  get activeMetadataDenial(): MetadataDenial | undefined {
    const { denial } = this.record.metadata;
    if (denial && isAfter(denial.endDate, startOfToday())) return denial;
  }

  get denial(): Denial | undefined {
    if (!this.rootStore.userStore.activeFeatureVariants.usMeCaseNoteSnooze)
      return super.denial;

    const { activeMetadataDenial } = this;
    if (!activeMetadataDenial) return undefined;
    const { reasons, otherReason, updatedBy, startDate } = activeMetadataDenial;

    return {
      reasons,
      otherReason,
      updated: {
        by: updatedBy,
        date: Timestamp.fromDate(startDate),
      },
    };
  }

  get manualSnooze(): ManualSnoozeUpdate | undefined {
    if (!this.rootStore.userStore.activeFeatureVariants.usMeCaseNoteSnooze)
      return super.manualSnooze;

    const { activeMetadataDenial } = this;
    if (!activeMetadataDenial) return undefined;
    const { startDate, endDate, updatedBy } = activeMetadataDenial;

    return {
      snoozedOn: formatISO(startDate),
      snoozedBy: updatedBy,
      snoozeForDays: differenceInDays(endDate, startDate),
    };
  }

  get autoSnooze() {
    if (!this.rootStore.userStore.activeFeatureVariants.usMeCaseNoteSnooze)
      return super.autoSnooze;

    return undefined;
  }
}
