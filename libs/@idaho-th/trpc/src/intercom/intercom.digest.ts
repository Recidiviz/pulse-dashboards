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

import { setTimeout } from "node:timers/promises";

import { DateTime } from "luxon";

import {
  DigestRecipientAudience,
  DigestSendOutcome,
} from "~@idaho-th/prisma/client";
import { mapWithConcurrency } from "~@idaho-th/trpc/intercom/intercom.concurrency";
import { getIntercomAdminId } from "~@idaho-th/trpc/intercom/intercom.config";
import {
  DEFAULT_DIGEST_SEND_CONCURRENCY,
  DIGEST_LOG,
  DIGEST_TIME_ZONE,
  INTERCOM_DIGEST_PAGE_SIZE,
  INTERCOM_ERROR_CODE,
  INTERCOM_ERROR_MESSAGE,
  INTERCOM_MESSAGE,
  INTERCOM_SYNC_STATUS,
  MARK_SENT_MAX_ATTEMPTS,
  MARK_SENT_RETRY_DELAY_MS,
  NEW_CONTACT_SETTLE_MS,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { upsertContact } from "~@idaho-th/trpc/intercom/intercom.contacts";
import {
  listProviderUsersNeedingDigestPage,
  listStaffNeedingDigestPage,
  markProviderUserDigestSent,
  markStaffDigestSent,
  setStaffIntercomSync,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import {
  IntercomCodedError,
  intercomErrorCode,
} from "~@idaho-th/trpc/intercom/intercom.http";
import { mapStaffToIntercomContact } from "~@idaho-th/trpc/intercom/intercom.mapper";
import { intercomCreateMessage } from "~@idaho-th/trpc/intercom/intercom.messages";
import { syncProviderContact } from "~@idaho-th/trpc/intercom/intercom.provider.sync";
import { buildDigestEmailContent } from "~@idaho-th/trpc/intercom/intercom.template";
import type {
  DigestAudience,
  DigestEmailContent,
  DigestRecipientRow,
  DigestSendAttemptRecord,
  DigestSendStats,
  IntercomErrorCode,
  PreparedRecipient,
  ProviderSyncResult,
  RunHousingDigestDeps,
  SendCounts,
  SendDigestToContactDeps,
} from "~@idaho-th/trpc/intercom/intercom.types";

function emitDigestLog(
  deps: Pick<RunHousingDigestDeps, "logEvent">,
  event: Record<string, unknown>,
): void {
  const log =
    deps.logEvent ?? ((payload) => console.info(JSON.stringify(payload)));
  log({ scope: DIGEST_LOG.SCOPE, ...event });
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : INTERCOM_ERROR_CODE.UNKNOWN;
}

const PERMANENT_RECIPIENT_ERROR_CODES: ReadonlySet<IntercomErrorCode> = new Set(
  [
    INTERCOM_ERROR_CODE.UNAUTHORIZED,
    INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION,
    INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY,
    INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH,
    INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE,
  ],
);

export function isPermanentRecipientFailure(code: IntercomErrorCode): boolean {
  return PERMANENT_RECIPIENT_ERROR_CODES.has(code);
}

// A 5xx, timeout or network error can follow a delivered message: not retried.
// A 429 and the 404 Intercom documents for a contact not yet messageable are:
// developers.intercom.com/docs/references/rest-api/api.intercom.io/messages
const RETRYABLE_SEND_ERROR_CODES: ReadonlySet<IntercomErrorCode> = new Set([
  INTERCOM_ERROR_CODE.RATE_LIMITED,
  INTERCOM_ERROR_CODE.NOT_FOUND,
]);

function isRetryableSendFailure(code: IntercomErrorCode): boolean {
  return RETRYABLE_SEND_ERROR_CODES.has(code);
}

export function hasOperationalFailure(
  counts: SendCounts,
  otherAudienceSent: number,
): boolean {
  if (counts.failed === 0) return false;
  if (counts.failed > counts.failedPermanent) return true;
  if (counts.sent > 0) return false;
  return counts.failed >= 2 || otherAudienceSent === 0;
}

function isWeekdayInDigestTimeZone(now: Date): boolean {
  const weekday = DateTime.fromJSDate(now, { zone: DIGEST_TIME_ZONE }).weekday;
  return weekday >= 1 && weekday <= 5;
}

export async function sendDigestToContact(
  deps: SendDigestToContactDeps,
): Promise<{ messageId: string }> {
  const createMessage = deps.createMessage ?? intercomCreateMessage;
  const adminId = deps.adminId ?? getIntercomAdminId();

  const { data } = await createMessage(
    {
      message_type: INTERCOM_MESSAGE.TYPE_EMAIL,
      subject: deps.subject,
      body: deps.htmlBody,
      template: INTERCOM_MESSAGE.TEMPLATE_PLAIN,
      from: { type: INTERCOM_MESSAGE.FROM_ADMIN, id: adminId },
      to: { type: INTERCOM_MESSAGE.TO_USER, id: deps.contactId },
    },
    deps.requestOptions,
  );

  const messageId = data?.id;
  if (!messageId) {
    throw new IntercomCodedError(
      "Intercom POST /messages returned no message id",
      INTERCOM_ERROR_CODE.INVALID_RESPONSE,
    );
  }
  return { messageId };
}

function contactResolutionCode(result: ProviderSyncResult): IntercomErrorCode {
  if (result.status === INTERCOM_SYNC_STATUS.FAILED) return result.code;
  if (result.status === INTERCOM_SYNC_STATUS.DISABLED) {
    return INTERCOM_ERROR_CODE.SYNC_DISABLED;
  }
  if (result.status === INTERCOM_SYNC_STATUS.INELIGIBLE) {
    return INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE;
  }
  return INTERCOM_ERROR_CODE.CONTACT_UNRESOLVED;
}

async function resolveProviderContactId(
  deps: RunHousingDigestDeps,
  row: DigestRecipientRow,
): Promise<string> {
  const result = await syncProviderContact({
    prisma: deps.prisma,
    providerUserId: row.id,
    provider: {
      email: row.email,
      name: row.name ?? "",
      intercomContactId: null,
      intercomSyncedAt: null,
    },
    force: true,
    requestOptions: deps.requestOptions,
  });

  if (
    result.status !== INTERCOM_SYNC_STATUS.CREATED &&
    result.status !== INTERCOM_SYNC_STATUS.UPDATED
  ) {
    throw new IntercomCodedError(
      `Could not resolve an Intercom contact (${result.status})`,
      contactResolutionCode(result),
    );
  }
  return result.contactId;
}

async function resolveStaffContactId(
  deps: RunHousingDigestDeps,
  row: DigestRecipientRow,
): Promise<string> {
  const contact = mapStaffToIntercomContact({
    email: row.email,
    pseudonymizedId: row.pseudonymizedId ?? "",
  });
  if (!contact) {
    throw new IntercomCodedError(
      INTERCOM_ERROR_MESSAGE[INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE],
      INTERCOM_ERROR_CODE.CONTACT_INELIGIBLE,
    );
  }

  const { contactId } = await upsertContact(contact, deps.requestOptions);
  await setStaffIntercomSync(deps.prisma, row.id, {
    intercomContactId: contactId,
  });
  return contactId;
}

// `recipientId` on every DigestSendAttempt this audience writes is `row.id` —
// a HousingProviderUser id, matching the column's documented meaning.
const PROVIDER_AUDIENCE: DigestAudience = {
  name: "provider",
  logIdKey: "providerUserId",
  dbAudience: DigestRecipientAudience.PROVIDER,
  listPage: listProviderUsersNeedingDigestPage,
  markSent: markProviderUserDigestSent,
  resolveContactId: resolveProviderContactId,
};

const STAFF_AUDIENCE: DigestAudience = {
  name: "staff",
  logIdKey: "staffId",
  dbAudience: DigestRecipientAudience.STAFF,
  listPage: listStaffNeedingDigestPage,
  markSent: markStaffDigestSent,
  resolveContactId: resolveStaffContactId,
};

function emitSendFailure(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  row: DigestRecipientRow,
  contactId: string | null,
  err: unknown,
  isRetry = false,
): void {
  emitDigestLog(deps, {
    event: DIGEST_LOG.EVENT_SEND,
    audience: audience.name,
    status: DIGEST_LOG.STATUS_FAILED,
    [audience.logIdKey]: row.id,
    intercomContactId: contactId,
    code: intercomErrorCode(err),
    error: toErrorMessage(err),
    isRetry,
  });
}

async function prepareRecipients(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  rows: DigestRecipientRow[],
  concurrency: number,
  now: Date,
): Promise<{
  prepared: PreparedRecipient[];
  failed: number;
  failedPermanent: number;
  attempts: DigestSendAttemptRecord[];
}> {
  const outcomes = await mapWithConcurrency(rows, concurrency, async (row) => {
    if (row.intercomContactId) {
      const recipient: PreparedRecipient = {
        row,
        contactId: row.intercomContactId,
        contactResolved: false,
      };
      return { ok: true as const, recipient };
    }

    try {
      const recipient: PreparedRecipient = {
        row,
        contactId: await audience.resolveContactId(deps, row),
        contactResolved: true,
      };
      return { ok: true as const, recipient };
    } catch (err) {
      const code = intercomErrorCode(err);
      emitSendFailure(deps, audience, row, row.intercomContactId, err);
      const attempt: DigestSendAttemptRecord = {
        audience: audience.dbAudience,
        recipientId: row.id,
        attemptedAt: now,
        outcome: DigestSendOutcome.FAILED,
        errorCode: code,
        intercomContactId: row.intercomContactId,
        isRetry: false,
      };
      return { ok: false as const, code, attempt };
    }
  });

  const prepared = outcomes.flatMap((outcome) =>
    outcome.ok ? [outcome.recipient] : [],
  );
  const failedOutcomes = outcomes.flatMap((outcome) =>
    outcome.ok ? [] : [outcome],
  );
  const failedPermanent = failedOutcomes.filter((outcome) =>
    isPermanentRecipientFailure(outcome.code),
  ).length;
  return {
    prepared,
    failed: outcomes.length - prepared.length,
    failedPermanent,
    attempts: failedOutcomes.map((outcome) => outcome.attempt),
  };
}

type SendAttemptOutcome = {
  status: typeof DIGEST_LOG.STATUS_SENT | typeof DIGEST_LOG.STATUS_FAILED;
  code: IntercomErrorCode | null;
  attempt: DigestSendAttemptRecord;
  markSentFailed: boolean;
};

type AudienceSendCounts = SendCounts & { markSentFailed: number };

// Retrying the DB write is safe where retrying the send is not: setting
// lastDigestSentAt again is idempotent, and it's what stops a rerun resending.
async function markSentWithRetry(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  rowId: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const delayMs = deps.markSentRetryDelayMs ?? MARK_SENT_RETRY_DELAY_MS;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MARK_SENT_MAX_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential retries
      await audience.markSent(deps.prisma, rowId, now);
      return { ok: true };
    } catch (err) {
      lastError = err;
      if (attempt < MARK_SENT_MAX_ATTEMPTS && delayMs > 0) {
        // eslint-disable-next-line no-await-in-loop -- sequential retries
        await setTimeout(delayMs * attempt);
      }
    }
  }
  return { ok: false, error: lastError };
}

async function attemptSend(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  email: DigestEmailContent,
  adminId: string,
  now: Date,
  recipient: PreparedRecipient,
  isRetry: boolean,
): Promise<SendAttemptOutcome> {
  const { row, contactId, contactResolved } = recipient;

  let messageId: string;
  try {
    ({ messageId } = await sendDigestToContact({
      contactId,
      subject: email.subject,
      htmlBody: email.htmlBody,
      adminId,
      requestOptions: deps.requestOptions,
      createMessage: deps.createMessage,
    }));
  } catch (err) {
    const code = intercomErrorCode(err);
    emitSendFailure(deps, audience, row, contactId, err, isRetry);
    return {
      status: DIGEST_LOG.STATUS_FAILED,
      code,
      attempt: {
        audience: audience.dbAudience,
        recipientId: row.id,
        attemptedAt: now,
        outcome: DigestSendOutcome.FAILED,
        errorCode: code,
        intercomContactId: contactId,
        isRetry,
      },
      markSentFailed: false,
    };
  }

  // Intercom already accepted the message — nothing below this line can be
  // retried without risking a duplicate real send, whatever happens next.
  const marked = await markSentWithRetry(deps, audience, row.id, now);
  if (!marked.ok) {
    emitDigestLog(deps, {
      event: DIGEST_LOG.EVENT_MARK_SENT_FAILED,
      audience: audience.name,
      [audience.logIdKey]: row.id,
      messageId,
      attempts: MARK_SENT_MAX_ATTEMPTS,
      error: toErrorMessage(marked.error),
    });
  }

  emitDigestLog(deps, {
    event: DIGEST_LOG.EVENT_SEND,
    audience: audience.name,
    status: DIGEST_LOG.STATUS_SENT,
    [audience.logIdKey]: row.id,
    intercomContactId: contactId,
    contactResolved,
    isRetry,
    messageId,
  });
  return {
    status: DIGEST_LOG.STATUS_SENT,
    code: null,
    attempt: {
      audience: audience.dbAudience,
      recipientId: row.id,
      attemptedAt: now,
      outcome: DigestSendOutcome.SENT,
      errorCode: null,
      intercomContactId: contactId,
      isRetry,
    },
    markSentFailed: !marked.ok,
  };
}

function selectRetryTargets(
  prepared: PreparedRecipient[],
  firstPass: SendAttemptOutcome[],
): { recipient: PreparedRecipient; result: SendAttemptOutcome }[] {
  return prepared
    .map((recipient, index) => ({ recipient, result: firstPass[index] }))
    .filter(
      ({ recipient, result }) =>
        recipient.contactResolved &&
        result.status === DIGEST_LOG.STATUS_FAILED &&
        result.code !== null &&
        isRetryableSendFailure(result.code),
    );
}

function mergeRetryResults(
  prepared: PreparedRecipient[],
  firstPass: SendAttemptOutcome[],
  retryTargets: { recipient: PreparedRecipient; result: SendAttemptOutcome }[],
  retryResults: SendAttemptOutcome[],
): SendAttemptOutcome[] {
  const retryByRecipientId = new Map(
    retryTargets.map(({ recipient }, index) => [
      recipient.row.id,
      retryResults[index],
    ]),
  );
  return prepared.map(
    (recipient, index) =>
      retryByRecipientId.get(recipient.row.id) ?? firstPass[index],
  );
}

async function sendPage(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  rows: DigestRecipientRow[],
  email: DigestEmailContent,
  adminId: string,
  concurrency: number,
  now: Date,
): Promise<AudienceSendCounts> {
  const {
    prepared,
    failed: unresolved,
    failedPermanent: unresolvedPermanent,
    attempts: resolveFailureAttempts,
  } = await prepareRecipients(deps, audience, rows, concurrency, now);

  if (prepared.some((recipient) => recipient.contactResolved)) {
    const settleMs = deps.newContactSettleMs ?? NEW_CONTACT_SETTLE_MS;
    if (settleMs > 0) await setTimeout(settleMs);
  }

  const firstPass = await mapWithConcurrency(
    prepared,
    concurrency,
    (recipient) =>
      attemptSend(deps, audience, email, adminId, now, recipient, false),
  );

  // A contact resolved this run can fail its first send purely from Intercom's
  // create -> messageable lag — one deferred retry rules that out before
  // counting it a real failure. Only codes Intercom rejected outright qualify.
  const retryTargets = selectRetryTargets(prepared, firstPass);

  let retryResults: SendAttemptOutcome[] = [];
  if (retryTargets.length > 0) {
    const settleMs = deps.newContactSettleMs ?? NEW_CONTACT_SETTLE_MS;
    if (settleMs > 0) await setTimeout(settleMs);
    retryResults = await mapWithConcurrency(
      retryTargets,
      concurrency,
      ({ recipient }) =>
        attemptSend(deps, audience, email, adminId, now, recipient, true),
    );
  }

  const finalResults = mergeRetryResults(
    prepared,
    firstPass,
    retryTargets,
    retryResults,
  );

  const attempts = [
    ...resolveFailureAttempts,
    ...firstPass.map((result) => result.attempt),
    ...retryResults.map((result) => result.attempt),
  ];
  if (attempts.length > 0) {
    // The sends in `attempts` already happened (or definitively failed) by
    // this point — losing the audit trail must never abort the rest of this
    // page, the next page, or the other audience.
    await deps.prisma.digestSendAttempt
      .createMany({ data: attempts })
      .catch((err: unknown) => {
        emitDigestLog(deps, {
          event: DIGEST_LOG.EVENT_ATTEMPT_LOG_FAILED,
          audience: audience.name,
          count: attempts.length,
          error: toErrorMessage(err),
        });
      });
  }

  const sent = finalResults.filter(
    (result) => result.status === DIGEST_LOG.STATUS_SENT,
  ).length;
  const sendPermanent = finalResults.filter(
    (result) =>
      result.status === DIGEST_LOG.STATUS_FAILED &&
      result.code !== null &&
      isPermanentRecipientFailure(result.code),
  ).length;
  return {
    sent,
    failed: unresolved + (finalResults.length - sent),
    failedPermanent: unresolvedPermanent + sendPermanent,
    markSentFailed: finalResults.filter((result) => result.markSentFailed)
      .length,
  };
}

async function sendDigestsForAudience(
  deps: RunHousingDigestDeps,
  audience: DigestAudience,
  email: DigestEmailContent,
  adminId: string,
  now: Date,
): Promise<AudienceSendCounts> {
  const pageSize = Math.max(1, deps.pageSize ?? INTERCOM_DIGEST_PAGE_SIZE);
  const concurrency = Math.max(
    1,
    deps.concurrency ?? DEFAULT_DIGEST_SEND_CONCURRENCY,
  );

  let sent = 0;
  let failed = 0;
  let failedPermanent = 0;
  let markSentFailed = 0;
  let cursorId: string | undefined;

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await audience.listPage(deps.prisma, pageSize, cursorId, now);
    if (rows.length === 0) break;

    // eslint-disable-next-line no-await-in-loop
    const page = await sendPage(
      deps,
      audience,
      rows,
      email,
      adminId,
      concurrency,
      now,
    );
    sent += page.sent;
    failed += page.failed;
    failedPermanent += page.failedPermanent;
    markSentFailed += page.markSentFailed;

    cursorId = rows[rows.length - 1]?.id;
    if (rows.length < pageSize || !cursorId) break;
  }

  return { sent, failed, failedPermanent, markSentFailed };
}

export async function runHousingDigest(
  deps: RunHousingDigestDeps,
): Promise<DigestSendStats> {
  const now = deps.now ?? new Date();

  if (!(deps.runOnWeekend ?? false) && !isWeekdayInDigestTimeZone(now)) {
    emitDigestLog(deps, {
      event: DIGEST_LOG.EVENT_RUN,
      status: DIGEST_LOG.STATUS_SKIPPED_WEEKEND,
      now: now.toISOString(),
    });
    return {
      providersSent: 0,
      providersFailed: 0,
      providersFailedPermanent: 0,
      staffSent: 0,
      staffFailed: 0,
      staffFailedPermanent: 0,
      providersMarkSentFailed: 0,
      staffMarkSentFailed: 0,
      skippedWeekend: true,
    };
  }

  const email = (deps.buildEmailContent ?? buildDigestEmailContent)();
  const adminId = (deps.getAdminId ?? getIntercomAdminId)();

  emitDigestLog(deps, {
    event: DIGEST_LOG.EVENT_RUN,
    status: DIGEST_LOG.STATUS_STARTED,
    subject: email.subject,
    adminId,
    runOnWeekend: deps.runOnWeekend ?? false,
    now: now.toISOString(),
  });

  const providers = await sendDigestsForAudience(
    deps,
    PROVIDER_AUDIENCE,
    email,
    adminId,
    now,
  );
  const staff = await sendDigestsForAudience(
    deps,
    STAFF_AUDIENCE,
    email,
    adminId,
    now,
  );

  const stats: DigestSendStats = {
    providersSent: providers.sent,
    providersFailed: providers.failed,
    providersFailedPermanent: providers.failedPermanent,
    staffSent: staff.sent,
    staffFailed: staff.failed,
    staffFailedPermanent: staff.failedPermanent,
    providersMarkSentFailed: providers.markSentFailed,
    staffMarkSentFailed: staff.markSentFailed,
    skippedWeekend: false,
  };

  emitDigestLog(deps, {
    event: DIGEST_LOG.EVENT_RUN,
    status: DIGEST_LOG.STATUS_FINISHED,
    ...stats,
    note: "sent means Intercom accepted POST /messages; mailbox delivery is Intercom → recipient",
  });

  return stats;
}
