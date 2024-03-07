/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { makeObservable } from "mobx";

import { formatWorkflowsDate } from "../../../../utils";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityRequirement } from "../../types";
import {
  UsMiClassificationReviewReferralRecord,
  usMiClassificationReviewSchemaForSupervisionLevelFormatter,
} from "./UsMiClassificationReviewReferralRecord";

export class UsMiClassificationReviewOpportunity extends OpportunityBase<
  Client,
  UsMiClassificationReviewReferralRecord
> {
  readonly hideUnknownCaseNoteDates = true;

  constructor(client: Client) {
    super(
      client,
      "usMiClassificationReview",
      client.rootStore,
      usMiClassificationReviewSchemaForSupervisionLevelFormatter((raw) =>
        client.rootStore.workflowsStore.formatSupervisionLevel(raw),
      ).parse,
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    const { eligibleDate } =
      this.record.eligibleCriteria.usMiClassificationReviewPastDueDate;

    return [
      {
        text: `Recommended classification review date, based on supervision start date and last classification review date, is ${formatWorkflowsDate(
          eligibleDate,
        )}`,
        tooltip:
          "Classification reviews shall be completed after six months of active supervision […] " +
          "Subsequent classification reviews shall be scheduled at six-month intervals.",
      },

      {
        text: "Currently eligible based on offense type and supervision level",
        tooltip:
          "The supervising Agent shall ensure that a Correctional Offender " +
          "Management Profiling for Alternative Sanctions (COMPAS) has been completed " +
          "for each offender on their active caseload as outlined in OP 06.01.145 " +
          "“Administration and Use of COMPAS and TAP.” Unless mandated by statute or " +
          "other criteria as directed in this operating procedure, the COMPAS shall be " +
          "used to determine the initial supervision level of each offender.\n" +
          "Unless an offender’s supervision level is mandated by policy or statute, " +
          "the supervising Agent shall reduce an offender’s supervision level if " +
          "the offender has satisfactorily completed six continuous months at the " +
          "current assigned supervision level.",
      },
    ];
  }

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleCriteria.usMiClassificationReviewPastDueDate
      .eligibleDate;
  }
}
