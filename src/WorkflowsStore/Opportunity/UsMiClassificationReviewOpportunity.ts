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

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { TransformFunction } from "../subscriptions";
import { fieldToDate, OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";

export type UsMiClassificationReviewReferralRecord = {
  eligibleCriteria: {
    usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
      supervisionLevel: string;
    };
    usMiClassificationReviewPastDueDate: {
      eligibleDate: Date;
    };
  };
};

export const getRecordTransformer = (client: Client) => {
  const transformer: TransformFunction<
    UsMiClassificationReviewReferralRecord
  > = (record) => {
    if (!record) {
      throw new Error("No record found");
    }

    const { stateCode, externalId, eligibleCriteria } = record;

    // The copy for these eligibility dates are the same. They are different
    // in TES, but we can treat them as the same thing in the frontend
    // since any client will only have one or the other
    let eligibleDate;
    if ("usMiPastInitialClassificationReviewDate" in eligibleCriteria) {
      eligibleDate =
        eligibleCriteria.usMiPastInitialClassificationReviewDate.eligibleDate;
    } else {
      eligibleDate =
        eligibleCriteria.usMiSixMonthsPastLastClassificationReviewDate
          .eligibleDate;
    }

    return {
      stateCode,
      externalId,
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
          supervisionLevel:
            client.rootStore.workflowsStore.formatSupervisionLevel(
              eligibleCriteria.usMiNotAlreadyOnLowestEligibleSupervisionLevel
                ?.supervisionLevel
            ),
        },
        usMiClassificationReviewPastDueDate: {
          eligibleDate: fieldToDate(eligibleDate),
        },
      },
    };
  };
  return transformer;
};

export class UsMiClassificationReviewOpportunity extends OpportunityBase<
  Client,
  UsMiClassificationReviewReferralRecord
> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
  ];

  constructor(client: Client) {
    super(
      client,
      "usMiClassificationReview",
      client.rootStore,
      getRecordTransformer(client)
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
          eligibleDate
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

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_MI;

  denialReasonsMap = {
    VIOLATIONS: "Excessive violation behavior during current review period",
    EMPLOYMENT:
      "Chronic unemployment with no effort to job search or recent, concerning unemployment",
    "FINES & FEES":
      "No effort to pay fines and fees despite documented ability to pay",
    "CASE PLAN":
      "No progress toward completion of Transition Accountability Plan goals/tasks",
    NONCOMPLIANT: "Noncompliant with the order of supervision",
    ABSCONSION: "Chronic missing of reporting dates",
    [OTHER_KEY]: "Other: please specify a reason",
  };

  get eligibilityDate(): Date | undefined {
    if (!this.record) return;
    return this.record.eligibleCriteria.usMiClassificationReviewPastDueDate
      .eligibleDate;
  }
}
