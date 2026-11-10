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

/**
 * HousingStaff DB upsert + Intercom contact sync for the Auth0 link-staff
 * webhook. Intercom failures are fail-open: the DB row is still committed so
 * login is never blocked.
 */

import { isIntercomTokenConfigured } from "~@idaho-th/trpc/intercom/intercom.config";
import {
  INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
  INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
  INTERCOM_SYNC_STATUS,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { upsertContact as defaultUpsertContact } from "~@idaho-th/trpc/intercom/intercom.contacts";
import {
  setStaffIntercomSync,
  upsertHousingStaffRow,
} from "~@idaho-th/trpc/intercom/intercom.helper";
import { intercomErrorCode } from "~@idaho-th/trpc/intercom/intercom.http";
import { mapStaffToIntercomContact } from "~@idaho-th/trpc/intercom/intercom.mapper";
import type {
  StaffLinkSyncResult,
  UpsertContactFn,
  UpsertStaffAndSyncIntercomDeps,
} from "~@idaho-th/trpc/intercom/intercom.types";

function isTokenAvailable(
  deps: Pick<UpsertStaffAndSyncIntercomDeps, "requestOptions">,
): boolean {
  return Boolean(deps.requestOptions?.token) || isIntercomTokenConfigured();
}

export async function upsertStaffAndSyncIntercom(
  deps: UpsertStaffAndSyncIntercomDeps,
): Promise<StaffLinkSyncResult> {
  const dbResult = await upsertHousingStaffRow(deps.prisma, {
    email: deps.email,
    pseudonymizedId: deps.pseudonymizedId,
  });

  if (dbResult.status === INTERCOM_SYNC_STATUS.CONFLICT) {
    return {
      status: INTERCOM_SYNC_STATUS.CONFLICT,
      existingPseudonymizedId: dbResult.existingPseudonymizedId,
    };
  }

  const { staff, emailChanged } = dbResult;
  const base = {
    staffId: staff.id,
    pseudonymizedId: staff.pseudonymizedId,
  };

  const needsIntercom = emailChanged || !staff.intercomSyncedAt;
  if (!needsIntercom) {
    return {
      status: INTERCOM_SYNC_STATUS.SKIPPED,
      ...base,
      ...(staff.intercomContactId
        ? { contactId: staff.intercomContactId }
        : {}),
    };
  }

  if (!isTokenAvailable(deps)) {
    return { status: INTERCOM_SYNC_STATUS.DISABLED, ...base };
  }

  const contact = mapStaffToIntercomContact({
    email: staff.email,
    pseudonymizedId: staff.pseudonymizedId,
  });
  if (!contact) {
    return { status: INTERCOM_SYNC_STATUS.DISABLED, ...base };
  }

  const upsertContact: UpsertContactFn =
    deps.upsertContact ?? defaultUpsertContact;

  try {
    const { contactId } = await upsertContact(
      contact,
      {
        ...deps.requestOptions,
        maxAttempts:
          deps.requestOptions?.maxAttempts ?? INTERCOM_LOGIN_SYNC_MAX_ATTEMPTS,
        timeoutMs:
          deps.requestOptions?.timeoutMs ??
          deps.timeoutMs ??
          INTERCOM_LOGIN_SYNC_TIMEOUT_MS,
      },
      staff.intercomContactId,
    );

    await setStaffIntercomSync(deps.prisma, staff.id, {
      intercomContactId: contactId,
    });

    return {
      status: dbResult.status,
      ...base,
      contactId,
    };
  } catch (err) {
    return {
      status: INTERCOM_SYNC_STATUS.FAILED,
      ...base,
      code: intercomErrorCode(err),
    };
  }
}
