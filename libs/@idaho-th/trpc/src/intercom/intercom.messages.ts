// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  INTERCOM_ERROR_CODE,
  INTERCOM_HTTP_METHOD,
  INTERCOM_PATH,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { intercomRequest } from "~@idaho-th/trpc/intercom/intercom.http";
import type {
  IntercomCreateMessageBody,
  IntercomErrorCode,
  IntercomHttpResult,
  IntercomMessage,
  IntercomRequestOptions,
} from "~@idaho-th/trpc/intercom/intercom.types";

// Message sends aren't idempotent, and a 5xx, timeout or network error can
// follow a delivered message. Only a 429, Intercom's rate-limit rejection, is
// retried.
function isSafeToResendMessage(error: { code: IntercomErrorCode }): boolean {
  return error.code === INTERCOM_ERROR_CODE.RATE_LIMITED;
}

export function intercomCreateMessage(
  body: IntercomCreateMessageBody,
  options?: IntercomRequestOptions,
): Promise<IntercomHttpResult<IntercomMessage>> {
  return intercomRequest<IntercomMessage>(
    INTERCOM_HTTP_METHOD.POST,
    INTERCOM_PATH.MESSAGES,
    { ...options, shouldRetry: isSafeToResendMessage },
    body,
  );
}
