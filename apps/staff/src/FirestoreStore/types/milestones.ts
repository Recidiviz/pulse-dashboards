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

import { ExternalSystemRequestStatus, UpdateLog } from "./metadata";
import { Denial } from "./opportunity";

export const TextMessageStatuses: Record<TextMessageStatus, TextMessageStatus> =
  {
    CONGRATULATED_ANOTHER_WAY: "CONGRATULATED_ANOTHER_WAY",
    DECLINED: "DECLINED",
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
  } as const;
export type MilestonesMessage = {
  updated: UpdateLog;
  status: TextMessageStatus;
  errors?: string[];
  declinedReasons?: Denial<DeclineReason>;
  pendingMessage?: string;
  message?: string;
  recipient?: string;
  sentBy?: string;
  mid?: string;
  stateCode?: string;
  userHash?: string;
};

/**
 * CONGRATULATED_ANOTHER_WAY: User has already sent congratulations in another way.
 * PENDING: User has started to compose a message but has not sent anything yet.
 * IN_PROGRESS: Request sent to backend and backend has sent it to Twilio
 * SUCCESS: Twilio confirms that message has been sent to the carrier
 * FAILURE: Twilio returns an error that the message could not be sent, or
 *        our backend has an error.
 * DECLINED: Officer declined to send a message
 *
 * NOTE: SUCCESS and FAILURE statuses will be updated in Firestore by the backend API.
 */
export type TextMessageStatus =
  | "CONGRATULATED_ANOTHER_WAY"
  | "DECLINED"
  | ExternalSystemRequestStatus;
export type DeclineReason =
  | "MILESTONE_NOT_MET"
  | "CLIENT_DECLINED_TEXTS"
  | "MISSING_CONTACT_INFO"
  | "Other";
