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
  INTERCOM_CONTACT,
  INTERCOM_ERROR_CODE,
  INTERCOM_ERROR_MESSAGE,
  INTERCOM_HTTP_METHOD,
  INTERCOM_PATH,
  INTERCOM_SYNC_STATUS,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  IntercomApiError,
  intercomRequest,
  isIntercomApiError,
} from "~@idaho-th/trpc/intercom/intercom.http";
import { normalizeEmail } from "~@idaho-th/trpc/intercom/intercom.mapper";
import type {
  IntercomContactInput,
  IntercomContactRecord,
  IntercomListResponse,
  IntercomRequestOptions,
  UpsertContactResult,
} from "~@idaho-th/trpc/intercom/intercom.types";

async function searchContactByField(
  field: string,
  value: string,
  options: IntercomRequestOptions,
): Promise<IntercomContactRecord | null> {
  const { data } = await intercomRequest<IntercomListResponse>(
    INTERCOM_HTTP_METHOD.POST,
    INTERCOM_PATH.CONTACTS_SEARCH,
    options,
    {
      query: {
        field,
        operator: INTERCOM_CONTACT.SEARCH_OPERATOR_EQUALS,
        value,
      },
    },
  );
  return data?.data?.[0] ?? null;
}

/**
 * Preferred lookup: `external_id` is unique in Intercom, so this resolves to
 * exactly one contact. An email search can match several, ambiguously.
 */
export function searchContactByExternalId(
  externalId: string,
  options: IntercomRequestOptions = {},
): Promise<IntercomContactRecord | null> {
  return searchContactByField(
    INTERCOM_CONTACT.SEARCH_FIELD_EXTERNAL_ID,
    externalId,
    options,
  );
}

/** Reads a contact by id. Returns null when Intercom no longer has it. */
export async function getContact(
  contactId: string,
  options: IntercomRequestOptions = {},
): Promise<IntercomContactRecord | null> {
  try {
    const { data } = await intercomRequest<IntercomContactRecord>(
      INTERCOM_HTTP_METHOD.GET,
      `${INTERCOM_PATH.CONTACTS}/${contactId}`,
      options,
    );
    return data ?? null;
  } catch (err) {
    if (isIntercomApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function createContact(
  input: IntercomContactInput,
  options: IntercomRequestOptions = {},
): Promise<IntercomContactRecord> {
  const { data } = await intercomRequest<IntercomContactRecord>(
    INTERCOM_HTTP_METHOD.POST,
    INTERCOM_PATH.CONTACTS,
    options,
    {
      role: INTERCOM_CONTACT.ROLE_USER,
      external_id: input.externalId,
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
    },
  );
  if (!data?.id) {
    throw new IntercomApiError(
      "Intercom POST /contacts returned no contact id",
      {
        status: 502,
        code: INTERCOM_ERROR_CODE.INVALID_RESPONSE,
        retryable: true,
      },
    );
  }
  return data;
}

/**
 * Archived contacts are invisible to `/contacts/search` but still hold the
 * email, so a create conflicts with them and nothing else can reach them.
 */
export async function unarchiveContact(
  contactId: string,
  options: IntercomRequestOptions = {},
): Promise<void> {
  await intercomRequest(
    INTERCOM_HTTP_METHOD.POST,
    `${INTERCOM_PATH.CONTACTS}/${contactId}${INTERCOM_PATH.UNARCHIVE_SUFFIX}`,
    options,
  );
}

/** Inverse of {@link unarchiveContact}: puts a contact back out of reach. */
export async function archiveContact(
  contactId: string,
  options: IntercomRequestOptions = {},
): Promise<void> {
  await intercomRequest(
    INTERCOM_HTTP_METHOD.POST,
    `${INTERCOM_PATH.CONTACTS}/${contactId}${INTERCOM_PATH.ARCHIVE_SUFFIX}`,
    options,
  );
}

export async function updateContact(
  contactId: string,
  input: IntercomContactInput,
  options: IntercomRequestOptions = {},
): Promise<IntercomContactRecord> {
  const { data } = await intercomRequest<IntercomContactRecord>(
    INTERCOM_HTTP_METHOD.PUT,
    `${INTERCOM_PATH.CONTACTS}/${contactId}`,
    options,
    {
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
    },
  );
  return data ?? { id: contactId, email: input.email };
}

function extractConflictContactId(err: IntercomApiError): string | undefined {
  return /\bid=([A-Za-z0-9]+)/.exec(err.detail ?? "")?.[1];
}

function isArchivedConflict(err: IntercomApiError): boolean {
  return /archived/i.test(err.detail ?? "");
}

async function restoreArchivedContact(
  contactId: string,
  options: IntercomRequestOptions,
): Promise<void> {
  try {
    await unarchiveContact(contactId, options);
  } catch (err) {
    if (
      isIntercomApiError(err) &&
      /permanent deletion|not restorable/i.test(err.detail ?? "")
    ) {
      // Terminal: the email is unusable until Intercom finishes deleting.
      throw new IntercomApiError(
        INTERCOM_ERROR_MESSAGE[INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION],
        {
          status: err.status,
          code: INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION,
          retryable: false,
          cause: err,
        },
      );
    }
    throw err;
  }
}

function holdsSameEmail(
  existing: IntercomContactRecord,
  input: IntercomContactInput,
): boolean {
  if (!existing.email) return false;
  return normalizeEmail(existing.email) === normalizeEmail(input.email);
}

async function rollbackRestore(
  contactId: string,
  options: IntercomRequestOptions,
): Promise<void> {
  try {
    await archiveContact(contactId, options);
  } catch {
    // Intentionally swallowed: the ownership refusal is the error that matters.
  }
}

async function adoptConflictContact(
  err: IntercomApiError,
  input: IntercomContactInput,
  options: IntercomRequestOptions,
): Promise<UpsertContactResult | null> {
  const conflictId = extractConflictContactId(err);
  if (!conflictId) return null;

  let existing = await getContact(conflictId, options);
  let restored = false;

  if (!existing) {
    if (!isArchivedConflict(err)) return null;
    await restoreArchivedContact(conflictId, options);
    restored = true;
    existing = await getContact(conflictId, options);
  }

  // Unverifiable even restored: undo the restore rather than guess.
  if (!existing) {
    if (restored) await rollbackRestore(conflictId, options);
    return null;
  }

  if (existing.external_id && existing.external_id !== input.externalId) {
    if (restored) await rollbackRestore(conflictId, options);
    throw new IntercomApiError(
      INTERCOM_ERROR_MESSAGE[
        INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY
      ],
      {
        status: err.status,
        code: INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY,
        retryable: false,
      },
    );
  }

  if (!existing.external_id && !holdsSameEmail(existing, input)) {
    if (restored) await rollbackRestore(conflictId, options);
    throw new IntercomApiError(
      INTERCOM_ERROR_MESSAGE[INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH],
      {
        status: err.status,
        code: INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH,
        retryable: false,
      },
    );
  }

  if (!restored && (existing.archived || isArchivedConflict(err))) {
    await restoreArchivedContact(conflictId, options);
  }

  if (existing.external_id) {
    await updateContact(conflictId, input, options);
  }

  return { status: INTERCOM_SYNC_STATUS.UPDATED, contactId: conflictId };
}

async function resolveConflict(
  err: IntercomApiError,
  input: IntercomContactInput,
  options: IntercomRequestOptions,
): Promise<UpsertContactResult | null> {
  const mine = await searchContactByExternalId(input.externalId, options);
  if (mine) {
    await updateContact(mine.id, input, options);
    return { status: INTERCOM_SYNC_STATUS.UPDATED, contactId: mine.id };
  }

  return adoptConflictContact(err, input, options);
}

export async function upsertContact(
  input: IntercomContactInput,
  options: IntercomRequestOptions = {},
  knownContactId?: string | null,
): Promise<UpsertContactResult> {
  if (knownContactId) {
    try {
      await updateContact(knownContactId, input, options);
      return {
        status: INTERCOM_SYNC_STATUS.UPDATED,
        contactId: knownContactId,
      };
    } catch (err) {
      if (!isIntercomApiError(err) || err.status !== 404) throw err;
    }
  }

  try {
    const created = await createContact(input, options);
    return { status: INTERCOM_SYNC_STATUS.CREATED, contactId: created.id };
  } catch (err) {
    if (isIntercomApiError(err) && err.status === 409) {
      const resolved = await resolveConflict(err, input, options);
      if (!resolved) throw err;
      return resolved;
    }
    throw err;
  }
}
