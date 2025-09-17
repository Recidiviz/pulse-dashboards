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

import { FieldValue } from "@google-cloud/firestore";

import { UsTnExpirationDraftData } from "../../WorkflowsStore";
import {
  ExternalRequestUpdate,
  ExternalSystemRequestStatus,
  UpdateLog,
} from "./metadata";

export type SharedSnoozeUpdate = {
  snoozedBy: string;
  snoozedOn: string;
};
export type Denial<DenialReason = string> = {
  reasons: DenialReason[];
  // Maps denial reasons to the text input submitted alongside that particular
  // denial reason.
  userInput?: Record<string, string>;
  // TODO(#9612): Move "Other" reason into the userInput mapping
  otherReason?: string;
  updated?: UpdateLog;
};

export type Submission = UpdateLog & {
  subcategory?: string;
};
export type ManualSnoozeUpdate = {
  snoozeForDays?: number;
  snoozeUntil?: never;
} & SharedSnoozeUpdate;

export type AutoSnoozeUpdate = {
  snoozeUntil?: string;
  snoozeForDays?: never;
} & SharedSnoozeUpdate;

export type SupervisorAction = UpdateLog & {
  type: "APPROVAL" | "DENIAL";
  revisionRequest?: string;
};

export type OfficerApprovalAction = {
  type: "APPROVAL";
  notes?: string;
};

export type OfficerDenialAction = {
  type: "DENIAL";
  // TODO(#9611): Move action plan input to the userInput mapping
  actionPlan?: string;
  denialReasons: string[];
  // Undefined for indefinite snoozes
  requestedSnoozeLength?: number;
  // Maps denial reasons to the text input submitted alongside that particular
  // denial reason.
  userInput?: Record<string, string>;
};

export type OfficerAction = UpdateLog &
  (OfficerApprovalAction | OfficerDenialAction) & {
    supervisorResponse?: SupervisorAction;
    // Set to true when this OfficerAction should not be relied upon to determine
    // a client's status or tab. Signifies that some unrelated action has been taken to
    // break the client out of the supervisor approval flow (e.g. the client was
    // snoozed successfully, ending the approval lifecycle).
    isStale: boolean;
  };

export type OpportunityUpdate = {
  denial?: Denial;
  submitted?: Submission;
  actionHistory?: OfficerAction[];
  manualSnooze?: ManualSnoozeUpdate;
  autoSnooze?: AutoSnoozeUpdate;
  omsSnooze?: ExternalRequestUpdate<{ snoozeUntil: string }>;
  completed?: {
    update: UpdateLog;
  };
  lastViewed?: UpdateLog;
};

export type OpportunityUpdateWithForm<FormType> = OpportunityUpdate & {
  referralForm?: { updated: UpdateLog; data?: Partial<FormType> };
};

export type FormUpdate<FormDataType> = {
  updated: UpdateLog;
  data?: Partial<FormDataType>;
};

export type UsTnContactNote = {
  note: Record<number, string[]>;
  noteStatus?: Record<number, ExternalSystemRequestStatus>;
  error?: string;
};

export type UsTnExpirationOpportunityUpdate =
  OpportunityUpdateWithForm<UsTnExpirationDraftData> & {
    contactNote: ExternalRequestUpdate<UsTnContactNote>;
  };
export type FormFieldData = Record<
  string,
  boolean | string | string[] | FieldValue
>;
