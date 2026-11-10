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

export const INTERCOM_ENV = {
  TOKEN: "INTERCOM_TOKEN",
  ADMIN_ID: "INTERCOM_ADMIN_ID",
  API_BASE: "INTERCOM_API_BASE",
  TEMPLATE_DIR: "IDAHO_TH_INTERCOM_TEMPLATE_DIR",
} as const;

export const INTERCOM_API_BASE_URL = "https://api.intercom.io";
export const INTERCOM_API_VERSION = "2.11";
export const MAX_INTERCOM_ATTEMPTS = 3;
export const INTERCOM_RETRY_BACKOFF_FACTOR = 2;
export const INTERCOM_RETRY_MIN_TIMEOUT_MS = 250;
export const MAX_INTERCOM_RETRY_AFTER_MS = 10_000;
export const MAX_INTERCOM_ERROR_DETAIL_CHARS = 500;

export const INTERCOM_HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
} as const;

export const INTERCOM_PATH = {
  MESSAGES: "/messages",
  CONTACTS: "/contacts",
  CONTACTS_SEARCH: "/contacts/search",
  UNARCHIVE_SUFFIX: "/unarchive",
  ARCHIVE_SUFFIX: "/archive",
} as const;

export const INTERCOM_MESSAGE = {
  TYPE_EMAIL: "email",
  TEMPLATE_PLAIN: "plain",
  FROM_ADMIN: "admin",
  TO_USER: "user",
} as const;

export const INTERCOM_CONTACT = {
  ROLE_USER: "user",
  SEARCH_FIELD_EXTERNAL_ID: "external_id",
  SEARCH_OPERATOR_EQUALS: "=",
} as const;

export const INTERCOM_EXTERNAL_ID_NAMESPACE = {
  PROVIDER: "provider",
  STAFF: "staff",
} as const;

export const INTERCOM_SYNC_STATUS = {
  CREATED: "created",
  UPDATED: "updated",
  SKIPPED: "skipped",
  /** Resolved onto a pre-existing row rather than the identity we were handed. */
  ADOPTED: "adopted",
  INELIGIBLE: "ineligible",
  DISABLED: "disabled",
  CONFLICT: "conflict",
  FAILED: "failed",
} as const;

/**
 * The only vocabulary a sync/digest failure is ever reported in. Intercom's own
 * error prose stays inside `IntercomApiError.detail` and is never returned to a
 * caller or written to a log — it is third-party text that can echo submitted
 * fields, so mapping to these codes keeps responses stable and free of it.
 */
export const INTERCOM_ERROR_CODE = {
  UNAUTHENTICATED: "intercom_unauthenticated",
  UNAUTHORIZED: "intercom_unauthorized",
  RATE_LIMITED: "intercom_rate_limited",
  NOT_FOUND: "intercom_not_found",
  CONFLICT: "intercom_conflict",
  CONTACT_OWNED_BY_ANOTHER_IDENTITY:
    "intercom_contact_owned_by_another_identity",
  CONTACT_PENDING_DELETION: "intercom_contact_pending_permanent_deletion",
  CONTACT_EMAIL_MISMATCH: "intercom_contact_email_mismatch",
  INVALID_REQUEST: "intercom_invalid_request",
  INVALID_RESPONSE: "intercom_invalid_response",
  UPSTREAM_UNAVAILABLE: "intercom_upstream_unavailable",
  TIMEOUT: "intercom_timeout",
  NETWORK: "intercom_network_error",
  DUPLICATE_INTERCOM_CONTACT: "duplicate_intercom_contact",
  SYNC_DISABLED: "intercom_sync_disabled",
  CONTACT_INELIGIBLE: "intercom_contact_ineligible",
  CONTACT_UNRESOLVED: "intercom_contact_unresolved",
  UNKNOWN: "unknown_error",
} as const;

export const PRISMA_UNIQUE_VIOLATION_CODE = "P2002";

export const DIGEST_LOG = {
  SCOPE: "intercom-digest",
  EVENT_RUN: "run",
  EVENT_SEND: "send",
  EVENT_ATTEMPT_LOG_FAILED: "attempt_log_failed",
  EVENT_MARK_SENT_FAILED: "mark_sent_failed",
  STATUS_STARTED: "started",
  STATUS_FINISHED: "finished",
  STATUS_SKIPPED_WEEKEND: "skipped_weekend",
  STATUS_SENT: "sent",
  STATUS_FAILED: "failed",
} as const;

export const DIGEST_JOB_LOG = {
  JOB: DIGEST_LOG.SCOPE,
  EVENT_START: "start",
  EVENT_COMPLETE: "complete",
  EVENT_ABORT: "abort",
  REASON_MISSING_ENV: "missing_intercom_env",
} as const;

export const PROVIDER_SYNC_JOB_LOG = {
  JOB: "intercom-provider-sync",
  EVENT_START: DIGEST_JOB_LOG.EVENT_START,
  EVENT_COMPLETE: DIGEST_JOB_LOG.EVENT_COMPLETE,
  EVENT_ABORT: DIGEST_JOB_LOG.EVENT_ABORT,
  REASON_MISSING_ENV: "missing_intercom_token",
} as const;

export const DIGEST_EMAIL_SUBJECT = "New updates in the Recidiviz Housing Tool";

export const DIGEST_TEMPLATE_FILENAME = "housingUpdatesDigest.email.html";
export const DIGEST_DASHBOARD_URL_PLACEHOLDER = "{{DASHBOARD_URL}}";
export const DIGEST_TIME_ZONE = "America/Denver";
export const DEFAULT_UPSERT_CONCURRENCY = 5;
export const INTERCOM_SYNC_PAGE_SIZE = 100;
export const INTERCOM_DIGEST_PAGE_SIZE = 50;
export const DEFAULT_DIGEST_SEND_CONCURRENCY = 5;
export const INTERCOM_REQUEST_TIMEOUT_MS = 10_000;
export const NEW_CONTACT_SETTLE_MS = 5000;
export const MARK_SENT_MAX_ATTEMPTS = 3;
export const MARK_SENT_RETRY_DELAY_MS = 500;
export const INTERCOM_LOGIN_SYNC_TIMEOUT_MS = 3000;
export const INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS = 1;

/** Our own wording for the failures we raise ourselves, keyed by error code. */
export const INTERCOM_ERROR_MESSAGE = {
  [INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION]:
    "Intercom contact is pending permanent deletion: it cannot be restored, and this email cannot be reused until Intercom completes the deletion",
  [INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY]:
    "Intercom named a contact whose external_id belongs to another identity; refusing to write to it",
  [INTERCOM_ERROR_CODE.INVALID_RESPONSE]:
    "Intercom returned a response this client cannot use",
  [INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH]:
    "Intercom named a contact with no external_id whose email is not the address we intend to mail; refusing to adopt it",
  [INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE]:
    "Recipient row cannot be mapped to an Intercom contact (missing email or identifier)",
} as const;
