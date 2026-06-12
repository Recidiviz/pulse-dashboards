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

export type RevisionResponse = UpdateLog & {
  type: "REVISION";
  // notes and reviewerId will only be non-null when type is REVISION
  notes: string;
  reviewerId: string;
};

export type ApprovalResponse = UpdateLog & {
  type: "APPROVAL";
};

export type DenialResponse = UpdateLog & {
  type: "DENIAL";
  // Only relevant for Iowa at this time.
  revisionRequest?: string;
};

export type SupervisorResponse = UpdateLog &
  (RevisionResponse | ApprovalResponse | DenialResponse);

export type OfficerApprovalRequest = {
  type: "APPROVAL";
  notes?: string;
  // Only relevant for Texas at this time. Used when enableSupervisorReviewChain fv is granted
  reviewerId?: string;
};

export type OfficerDenialRequest = {
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

export type OfficerRequest = UpdateLog &
  (OfficerApprovalRequest | OfficerDenialRequest) & {
    supervisorResponse?: SupervisorResponse;
    // Set to true when this OfficerAction should not be relied upon to determine
    // a client's status or tab. Signifies that some unrelated action has been taken to
    // break the client out of the supervisor approval flow (e.g. the client was
    // snoozed successfully, ending the approval lifecycle).
    isStale: boolean;
  };

export type OpportunityUpdate = {
  denial?: Denial;
  submitted?: Submission;
  actionHistory?: OfficerRequest[];
  manualSnooze?: ManualSnoozeUpdate;
  autoSnooze?: AutoSnoozeUpdate;
  omsSnooze?: ExternalRequestUpdate<{ snoozeUntil: string }>;
  completed?: {
    update: UpdateLog;
  };
  lastViewed?: UpdateLog;
  stateCode?: string;
  // The most recent (or current) reviewer.
  // Equivalent to the most recent actionHistory reviewerId if it exists (when type is "APPROVAL")
  // Stored here for easier firestore querying
  currentReviewerId?: string;
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

export type UsTnContactNoteHistory = Record<
  string,
  ExternalRequestUpdate<UsTnContactNote & { contactTypeCodes: string[] }>
>;

export type UsTnExpirationOpportunityUpdate =
  OpportunityUpdateWithForm<UsTnExpirationDraftData> & {
    contactNote: ExternalRequestUpdate<UsTnContactNote>;
  };
export type FormFieldData = Record<
  string,
  boolean | string | string[] | FieldValue
>;
