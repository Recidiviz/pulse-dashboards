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

import type {
  DigestRecipientAudience,
  DigestSendOutcome,
  PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  INTERCOM_ERROR_CODE,
  INTERCOM_HTTP_METHOD,
  INTERCOM_SYNC_STATUS,
} from "~@idaho-th/trpc/intercom/intercom.constants";

export type IntercomFetchFn = typeof fetch;

export type IntercomHttpMethod =
  (typeof INTERCOM_HTTP_METHOD)[keyof typeof INTERCOM_HTTP_METHOD];

export type IntercomRequestOptions = {
  token?: string;
  baseUrl?: string;
  fetchFn?: IntercomFetchFn;
  signal?: AbortSignal;
  /** Overall deadline when no `signal` is supplied. Defaults to INTERCOM_REQUEST_TIMEOUT_MS. */
  timeoutMs?: number;
  maxAttempts?: number;
  /** Which failed attempts get retried. Defaults to the error's own `retryable`. */
  shouldRetry?: (error: {
    code: IntercomErrorCode;
    retryable: boolean;
  }) => boolean;
};

export type IntercomHttpResult<T> = {
  status: number;
  data: T | null;
};

export type IntercomCreateMessageBody = {
  message_type: "email" | "inapp" | "facebook" | "twitter";
  subject?: string;
  body: string;
  template: "plain" | "personal";
  from: { type: "admin"; id: string | number };
  to: {
    type: "user" | "lead" | "contact";
    id: string;
  };
  create_conversation_without_contact_reply?: boolean;
};

export type IntercomMessage = {
  type?: string;
  id: string;
  subject?: string;
  body?: string;
  message_type?: string;
};

export type IntercomContactInput = {
  email: string;
  externalId: string;
  name?: string;
};

/**
 * The person an Intercom contact is addressed to — a `HousingProviderUser`,
 * never an organization. `name` and `email` are the person's own, so
 * correspondence reaches them rather than the organization they manage.
 */
export type ProviderContactSource = {
  id: string;
  email: string;
  name: string;
};

export type StaffContactSource = {
  email: string;
  pseudonymizedId: string;
};

export type EligibleProviderUserRow = {
  id: string;
  email: string;
  name: string;
  intercomContactId: string | null;
  intercomSyncedAt: Date | null;
};

export type DigestRecipientRow = {
  id: string;
  intercomContactId: string | null;
  email: string;
  name: string | null;
  pseudonymizedId: string | null;
};

export type IntercomContactRecord = {
  id: string;
  email?: string | null;
  external_id?: string | null;
  archived?: boolean | null;
};

export type IntercomListResponse = {
  data?: IntercomContactRecord[];
};

export type UpsertContactResult = {
  status:
    | typeof INTERCOM_SYNC_STATUS.CREATED
    | typeof INTERCOM_SYNC_STATUS.UPDATED;
  contactId: string;
};

export type UpsertContactFn = (
  contact: IntercomContactInput,
  options?: IntercomRequestOptions,
  knownContactId?: string | null,
) => Promise<UpsertContactResult>;

export type IntercomErrorCode =
  (typeof INTERCOM_ERROR_CODE)[keyof typeof INTERCOM_ERROR_CODE];

export type ProviderSyncResult =
  | {
      status:
        | typeof INTERCOM_SYNC_STATUS.CREATED
        | typeof INTERCOM_SYNC_STATUS.UPDATED;
      providerUserId: string;
      contactId: string;
    }
  | {
      status:
        | typeof INTERCOM_SYNC_STATUS.SKIPPED
        | typeof INTERCOM_SYNC_STATUS.INELIGIBLE
        | typeof INTERCOM_SYNC_STATUS.DISABLED;
      providerUserId?: string;
    }
  | {
      status: typeof INTERCOM_SYNC_STATUS.FAILED;
      providerUserId: string;
      /** Mapped code only — never Intercom's own error text. */
      code: IntercomErrorCode;
    };

export type BulkProviderSyncResult = {
  succeeded: number;
  failed: number;
  skipped: number;
  results: ProviderSyncResult[];
};

export type SyncProviderContactDeps = {
  prisma: PrismaClient;
  /** A `HousingProviderUser` id. Organizations have no Intercom contact. */
  providerUserId: string;
  /** The user row, when the caller already holds it — saves a re-read. */
  provider?: {
    email: string;
    name: string;
    intercomContactId?: string | null;
    intercomSyncedAt: Date | null;
  };
  force?: boolean;
  deferPersist?: boolean;
  upsertContact?: UpsertContactFn;
  requestOptions?: IntercomRequestOptions;
  timeoutMs?: number;
};

export type SyncAllProvidersDeps = {
  prisma: PrismaClient;
  upsertContact?: UpsertContactFn;
  concurrency?: number;
  pageSize?: number;
  requestOptions?: IntercomRequestOptions;
  force?: boolean;
};

export type HousingStaffSyncRow = {
  id: string;
  email: string;
  pseudonymizedId: string;
  intercomContactId: string | null;
  intercomSyncedAt: Date | null;
};

export type UpsertHousingStaffInput = {
  pseudonymizedId: string;
  email: string;
};

export type UpsertHousingStaffResult =
  | {
      status:
        | typeof INTERCOM_SYNC_STATUS.CREATED
        | typeof INTERCOM_SYNC_STATUS.UPDATED
        | typeof INTERCOM_SYNC_STATUS.ADOPTED;
      staff: HousingStaffSyncRow;
      emailChanged: boolean;
    }
  | {
      status: typeof INTERCOM_SYNC_STATUS.CONFLICT;
      existingPseudonymizedId: string;
    };

export type StaffLinkSyncResult =
  | {
      status:
        | typeof INTERCOM_SYNC_STATUS.ADOPTED
        | typeof INTERCOM_SYNC_STATUS.CREATED
        | typeof INTERCOM_SYNC_STATUS.UPDATED
        | typeof INTERCOM_SYNC_STATUS.SKIPPED
        | typeof INTERCOM_SYNC_STATUS.DISABLED;
      staffId: string;
      pseudonymizedId: string;
      contactId?: string;
    }
  | {
      status: typeof INTERCOM_SYNC_STATUS.CONFLICT;
      existingPseudonymizedId: string;
    }
  | {
      status: typeof INTERCOM_SYNC_STATUS.FAILED;
      staffId: string;
      pseudonymizedId: string;
      code: IntercomErrorCode;
    };

export type UpsertStaffAndSyncIntercomDeps = {
  prisma: PrismaClient;
  email: string;
  pseudonymizedId: string;
  upsertContact?: UpsertContactFn;
  requestOptions?: IntercomRequestOptions;
  timeoutMs?: number;
};

export type DigestEmailContent = {
  subject: string;
  htmlBody: string;
};

export type DigestAudience = {
  readonly name: "provider" | "staff";
  /** Log key for the recipient's own id. Always an opaque id, never PII. */
  readonly logIdKey: "providerUserId" | "staffId";
  readonly dbAudience: DigestRecipientAudience;
  readonly listPage: (
    prisma: PrismaClient,
    pageSize: number,
    cursorId: string | undefined,
    now: Date,
  ) => Promise<DigestRecipientRow[]>;
  readonly markSent: (
    prisma: PrismaClient,
    id: string,
    sentAt: Date,
  ) => Promise<void>;
  readonly resolveContactId: (
    deps: RunHousingDigestDeps,
    row: DigestRecipientRow,
  ) => Promise<string>;
};

export type SendCounts = {
  sent: number;
  failed: number;
  /** Subset of `failed` that is permanent and recipient-specific (a suppressed
   * contact, a pending-deletion contact, an identity conflict, an ineligible
   * row) — not an outage. Broken out so a single bad contact doesn't page the
   * same way a token or upstream failure would. */
  failedPermanent: number;
};

export type PreparedRecipient = {
  row: DigestRecipientRow;
  contactId: string;
  contactResolved: boolean;
};

export type DigestSendAttemptRecord = {
  audience: DigestRecipientAudience;
  recipientId: string;
  attemptedAt: Date;
  outcome: DigestSendOutcome;
  errorCode: string | null;
  intercomContactId: string | null;
  isRetry: boolean;
};

export type DigestSendStats = {
  providersSent: number;
  providersFailed: number;
  providersFailedPermanent: number;
  staffSent: number;
  staffFailed: number;
  staffFailedPermanent: number;
  /** Sends Intercom accepted whose lastDigestSentAt write still failed after
   * retries, so a same-day rerun would email that recipient again. */
  providersMarkSentFailed: number;
  staffMarkSentFailed: number;
  skippedWeekend: boolean;
};

export type CreateIntercomMessageFn = (
  body: IntercomCreateMessageBody,
  options?: IntercomRequestOptions,
) => Promise<IntercomHttpResult<IntercomMessage>>;

export type SendDigestToContactDeps = {
  contactId: string;
  subject: string;
  htmlBody: string;
  adminId?: string;
  requestOptions?: IntercomRequestOptions;
  createMessage?: CreateIntercomMessageFn;
};

export type RunHousingDigestDeps = {
  prisma: PrismaClient;
  pageSize?: number;
  concurrency?: number;
  now?: Date;
  runOnWeekend?: boolean;
  newContactSettleMs?: number;
  markSentRetryDelayMs?: number;
  requestOptions?: IntercomRequestOptions;
  createMessage?: CreateIntercomMessageFn;
  buildEmailContent?: () => DigestEmailContent;
  getAdminId?: () => string;
  logEvent?: (event: Record<string, unknown>) => void;
};
