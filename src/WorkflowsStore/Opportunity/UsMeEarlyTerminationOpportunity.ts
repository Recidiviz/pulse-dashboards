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

import { differenceInDays, startOfToday } from "date-fns";
import dedent from "dedent";
import { DocumentData } from "firebase/firestore";
import { computed, makeObservable } from "mobx";

import { WORKFLOWS_METHODOLOGY_URL } from "../../core/utils/constants";
import { OpportunityProfileModuleName } from "../../core/WorkflowsClientProfile/OpportunityProfile";
import { FeatureGateError, OpportunityValidationError } from "../../errors";
import { formatAsCurrency, formatWorkflowsDate } from "../../utils";
import { Client } from "../Client";
import { OTHER_KEY } from "../utils";
import { OpportunityBase } from "./OpportunityBase";
import { OpportunityRequirement } from "./types";
import {
  transformReferral,
  UsMeEarlyTerminationReferralRecord,
} from "./UsMeEarlyTerminationReferralRecord";

const DENIAL_REASONS_MAP = {
  BENEFIT:
    "Continuation on probation would benefit the community or the client",
  COMPLETION: "Has not completed conditions of probation",
  CONDUCT: "Has engaged in prohibited conduct",
  [OTHER_KEY]: "Other, please specify a reason",
};

const CRITERIA: Record<
  keyof UsMeEarlyTerminationReferralRecord["eligibleCriteria"],
  Partial<OpportunityRequirement>
> = {
  usMePaidAllOwedRestitution: {
    tooltip: dedent`In compliance with Department Policy (ACC) 9.6, Restitution and Fees, 
      under no circumstances may a Probation Officer make a motion for or agree to early 
      termination of probation if the probationer has not paid the total amount of restitution owed.`,
  },
  noConvictionWithin6Months: {
    tooltip: dedent`In addition, whenever a person on probation is convicted of a new crime 
      during the period of probation, the probation is not revoked, and the person
      is sentenced to an unsuspended term of imprisonment which is concurrent with the
      period of probation and the term of imprisonment will not expire until the
      period of probation is completed, the Probation Officer may file a motion
      with the court for early termination of probation.`,
  },
  supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {},
  onMediumSupervisionLevelOrLower: {},
  usMeNoPendingViolationsWhileSupervised: {},
};

const validateRecord =
  (client: Client) =>
  (record: DocumentData | undefined): DocumentData | undefined => {
    if (!record) return;

    const {
      eligibleCriteria: {
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart:
          pastHalfFullTermRelease,
      },
      ineligibleCriteria: {
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart:
          ineligiblePastHalfFullTermRelease,
      },
    } = record;

    if (
      !pastHalfFullTermRelease?.eligibleDate &&
      !ineligiblePastHalfFullTermRelease?.eligibleDate
    ) {
      throw new OpportunityValidationError(
        "Missing early termination opportunity eligible date"
      );
    }

    if (
      !client.rootStore.workflowsStore.featureVariants.usMeAlmostPastHalfTerm &&
      Object.keys(record.ineligibleCriteria ?? {}).length > 0
    ) {
      throw new FeatureGateError(
        "Missing almost past half term feature is disabled."
      );
    }

    return record;
  };

export class UsMeEarlyTerminationOpportunity extends OpportunityBase<
  Client,
  UsMeEarlyTerminationReferralRecord
> {
  readonly opportunityProfileModules: OpportunityProfileModuleName[] = [
    "ClientProfileDetails",
    "CaseNotes",
  ];

  readonly policyOrMethodologyUrl = WORKFLOWS_METHODOLOGY_URL.US_ME;

  readonly hideUnknownCaseNoteDates = true;

  constructor(client: Client) {
    super(
      client,
      "usMeEarlyTermination",
      client.rootStore,
      transformReferral,
      validateRecord(client)
    );

    makeObservable(this, {
      almostEligible: computed,
      requirementsMet: computed,
      requirementsAlmostMet: computed,
      almostEligibleStatusMessage: computed,
    });

    this.denialReasonsMap = DENIAL_REASONS_MAP;
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible || !this.record) return;
    const { ineligibleCriteria } = this.record;

    if (ineligibleCriteria.usMePaidAllOwedRestitution?.amountOwed) {
      return `Remaining Restitution Balance ${formatAsCurrency(
        ineligibleCriteria.usMePaidAllOwedRestitution.amountOwed
      )}`;
    }
    if (
      ineligibleCriteria.usMeNoPendingViolationsWhileSupervised?.violationDate
    ) {
      return `Violation Pending since ${formatWorkflowsDate(
        ineligibleCriteria.usMeNoPendingViolationsWhileSupervised.violationDate
      )}`;
    }
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirements: OpportunityRequirement[] = [];
    const {
      eligibleCriteria: {
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart,
        noConvictionWithin6Months,
        onMediumSupervisionLevelOrLower,
        usMePaidAllOwedRestitution,
        usMeNoPendingViolationsWhileSupervised,
      },
    } = this.record;

    if (
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart?.eligibleDate
    ) {
      requirements.push({
        text: `Served 1/2 of probation term`,
        tooltip:
          CRITERIA.supervisionPastHalfFullTermReleaseDateFromSupervisionStart
            .tooltip,
      });
    }

    if (onMediumSupervisionLevelOrLower?.supervisionLevel) {
      requirements.push({
        text: `Currently on ${onMediumSupervisionLevelOrLower?.supervisionLevel.toLowerCase()}`,
        tooltip: CRITERIA.onMediumSupervisionLevelOrLower.tooltip,
      });
    }

    if (
      usMePaidAllOwedRestitution &&
      usMePaidAllOwedRestitution?.amountOwed === 0
    ) {
      requirements.push({
        text: `Paid all owed restitution`,
        tooltip: CRITERIA.usMePaidAllOwedRestitution.tooltip,
      });
    } else if (
      usMePaidAllOwedRestitution &&
      !usMePaidAllOwedRestitution?.amountOwed
    ) {
      // If we don't have an amountOwed property, then there is no restitution case
      requirements.push({
        text: `No restitution owed`,
        tooltip: CRITERIA.usMePaidAllOwedRestitution.tooltip,
      });
    }

    if (!noConvictionWithin6Months?.latestConvictions) {
      requirements.push({
        text: `No new convictions in the past 6 months`,
        tooltip: CRITERIA.noConvictionWithin6Months.tooltip,
      });
    }

    if (
      usMeNoPendingViolationsWhileSupervised &&
      !usMeNoPendingViolationsWhileSupervised?.currentStatus
    ) {
      requirements.push({
        text: `No Pending Violations`,
        tooltip: CRITERIA.usMeNoPendingViolationsWhileSupervised.tooltip,
      });
    }

    return requirements;
  }

  get requirementsAlmostMet(): OpportunityRequirement[] {
    if (!this.record) return [];
    const requirementsAlmostMet: OpportunityRequirement[] = [];

    const {
      ineligibleCriteria: {
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart,
        usMeNoPendingViolationsWhileSupervised,
        usMePaidAllOwedRestitution,
      },
    } = this.record;

    if (
      supervisionPastHalfFullTermReleaseDateFromSupervisionStart?.eligibleDate
    ) {
      const daysUntilHalfFullTermReleaseDate = differenceInDays(
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart?.eligibleDate,
        startOfToday()
      );
      requirementsAlmostMet.push({
        text: `Will have served 1/2 of probation term in ${daysUntilHalfFullTermReleaseDate} days`,
        tooltip:
          CRITERIA.supervisionPastHalfFullTermReleaseDateFromSupervisionStart
            .tooltip,
      });
    }

    if (usMeNoPendingViolationsWhileSupervised?.violationDate) {
      requirementsAlmostMet.push({
        text: `Violation Pending since ${formatWorkflowsDate(
          usMeNoPendingViolationsWhileSupervised?.violationDate
        )}`,
        tooltip: CRITERIA.usMeNoPendingViolationsWhileSupervised.tooltip,
      });
    }

    if (usMePaidAllOwedRestitution?.amountOwed) {
      requirementsAlmostMet.push({
        text: `Remaining Restitution Balance ${formatAsCurrency(
          usMePaidAllOwedRestitution?.amountOwed
        )}`,
        tooltip: CRITERIA.usMePaidAllOwedRestitution.tooltip,
      });
    }

    return requirementsAlmostMet;
  }
}
