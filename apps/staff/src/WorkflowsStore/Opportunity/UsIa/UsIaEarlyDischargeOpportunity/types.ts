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

import { OpportunityUpdate, UpdateLog } from "../../../../FirestoreStore";

export type UsIaEarlyDischargeClientStatus =
  | "ELIGIBLE_NOW"
  | "ACTION_PLAN_REVIEW"
  | "ACTION_PLAN_REVIEW_REVISION"
  | "DISCHARGE_FORM_REVIEW"
  | "SNOOZE_REVIEW"
  | "READY_FOR_DISCHARGE"
  | "DENIED"
  | "SUBMITTED";

export type UsIaSupervisionLevelDowngradeClientStatus =
  | "ELIGIBLE_NOW"
  | "PENDING_ELIGIBILITY"
  | "DENIED"
  | "SUBMITTED";

/**
 * Where an Iowa early discharge charge is in the review and ICON flow. The
 * frontend writes SUPERVISOR_REVIEW and REVISIONS_REQUESTED; the backend
 * writes the ICON statuses.
 */
export type UsIaEarlyDischargeChargeStatus =
  | "SUPERVISOR_REVIEW"
  | "REVISIONS_REQUESTED"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILURE";

export type UsIaEarlyDischargeOpportunityUpdate = OpportunityUpdate & {
  /** Keyed by chargeExternalId. A charge with no entry hasn't been submitted. */
  charges?: Record<
    string,
    {
      iconSubmissionStatus: UsIaEarlyDischargeChargeStatus;
      /**
       * Who sent the charge to their supervisor, and when. Set each time the
       * PO sends it, including a resubmit after revisions; later statuses
       * leave it alone.
       */
      submitted?: UpdateLog;
    }
  >;
};
