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
// =============================================================================

import { DocumentData } from "firebase/firestore";
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OpportunityValidationError, OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMeEarlyTerminationReferralRecord,
} from "./UsMeEarlyTerminationReferralRecord";

const DENIAL_REASONS_MAP = {
  [OTHER_KEY]: "Other, please specify a reason",
};

const CRITERIA: Record<
  keyof UsMeEarlyTerminationReferralRecord["criteria"],
  Partial<OpportunityRequirement>
> = {
  noConvictionWithin6Months: {
    tooltip: `TBD`,
  },
  supervisionPastHalfFullTermReleaseDate: {
    tooltip: `TBD`,
  },
  onMediumSupervisionLevelOrLower: {
    tooltip: `Currently on Limited, Minimum, or Medium Custody`,
  },
};

function validateRecord(
  record: DocumentData | undefined
): DocumentData | undefined {
  if (!record) return;

  const {
    criteria: {
      supervisionPastHalfFullTermReleaseDate: pastHalfFullTermRelease,
    },
  } = record;

  if (!pastHalfFullTermRelease?.eligibleDate) {
    throw new OpportunityValidationError(
      "Missing early termination opportunity eligible date"
    );
  }

  if (!pastHalfFullTermRelease?.sentenceType) {
    throw new OpportunityValidationError(
      "Missing early termination opportunity sentence type"
    );
  }

  return record;
}

export class UsMeEarlyTerminationOpportunity extends OpportunityBase<
  Client,
  UsMeEarlyTerminationReferralRecord
> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
    "CaseNotes",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ME;

  constructor(client: Client) {
    super(
      client,
      "usMeEarlyTermination",
      client.rootStore,
      transformReferral,
      validateRecord
    );

    makeObservable(this, {
      requirementsMet: computed,
      requirementsAlmostMet: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      criteria: {
        supervisionPastHalfFullTermReleaseDate,
        noConvictionWithin6Months,
        onMediumSupervisionLevelOrLower,
      },
    } = this.record;

    if (supervisionPastHalfFullTermReleaseDate?.eligibleDate) {
      requirements.push({
        text: `Early termination past half full term release date is ${formatWorkflowsDate(
          supervisionPastHalfFullTermReleaseDate?.eligibleDate
        )}`,
        tooltip: CRITERIA.supervisionPastHalfFullTermReleaseDate.tooltip,
      });
    }

    if (onMediumSupervisionLevelOrLower?.supervisionLevel) {
      requirements.push({
        text: `Currently on ${onMediumSupervisionLevelOrLower?.supervisionLevel.toLowerCase()}`,
        tooltip: CRITERIA.onMediumSupervisionLevelOrLower.tooltip,
      });
    }

    if (supervisionPastHalfFullTermReleaseDate?.sentenceType) {
      requirements.push({
        text: `Currently on ${supervisionPastHalfFullTermReleaseDate?.sentenceType.toLowerCase()} sentence`,
        tooltip: CRITERIA.supervisionPastHalfFullTermReleaseDate.tooltip,
      });
    }
    if (noConvictionWithin6Months?.latestConvictions.length === 0) {
      requirements.push({
        text: `No convictions in past 6 months`,
        tooltip: CRITERIA.noConvictionWithin6Months.tooltip,
      });
    }

    return requirements;
  }

  get metadata(): UsMeEarlyTerminationReferralRecord["metadata"] | undefined {
    return this.record?.metadata;
  }
}
