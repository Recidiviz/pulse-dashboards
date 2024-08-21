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
  otherReason?: string;
  updated?: UpdateLog;
};
export type ManualSnoozeUpdate = {
  snoozeForDays?: number;
  snoozeUntil?: never;
} & SharedSnoozeUpdate;

export type AutoSnoozeUpdate = {
  snoozeUntil?: string;
  snoozeForDays?: never;
} & SharedSnoozeUpdate;

export type OpportunityUpdate = {
  denial?: Denial;
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
