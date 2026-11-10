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

import { TRPCError } from "@trpc/server";

import {
  PROVIDER_RESPONSE_ERROR_MESSAGE,
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";
import {
  type ResolvedProviderApplicationForResponse,
  resolveProviderApplicationForResponse,
} from "~@idaho-th/trpc/routes/housing-common/applicationProgression";
import { assertStaffCaseModifiable } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { buildApplicationWhereForProvider } from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  INFO_REQUEST_BAD_REQUEST,
  throwInfoRequestBadRequest,
} from "~@idaho-th/trpc/routes/infoRequest/infoRequest.helpers";

import { PROVIDER_RESPONSE_APPLICATION_SELECT } from "./providerResponse.selects";
import type {
  DbClient,
  ProviderApplicationForResponse,
  ProviderResponseApplicationRow,
} from "./providerResponse.types";

export const PROVIDER_RESPONSE_BAD_REQUEST = {
  MESSAGE_REQUIRED: PROVIDER_RESPONSE_ERROR_MESSAGE.MESSAGE_REQUIRED,
} as const;

type OwnedProviderApplication =
  ProviderResponseApplicationRow["providerApplications"][number];

/**
 * The acting organization's own match among every organization's matches on the
 * application. The row set is already scoped to an application this
 * organization was sent — `buildApplicationWhereForProvider` does that in the
 * query — but all matches are selected because the staff sub-stage is computed
 * across them, so the owned one is picked out here by organization id.
 */
function findOwnedProviderApplication(
  context: ProviderResponseApplicationRow,
  providerId: string,
): OwnedProviderApplication | undefined {
  return context.providerApplications.find(
    (providerApplication) => providerApplication.providerId === providerId,
  );
}

export function mapProviderApplicationForResponse(
  context: ProviderResponseApplicationRow | null,
  providerId: string,
): ProviderApplicationForResponse | null {
  if (context == null) {
    return null;
  }

  const ownedProviderApplication = findOwnedProviderApplication(
    context,
    providerId,
  );
  if (ownedProviderApplication == null) {
    return null;
  }

  return {
    id: ownedProviderApplication.id,
    providerId: ownedProviderApplication.providerId,
    stage: ownedProviderApplication.stage,
    subStage: ownedProviderApplication.subStage,
    providerName: ownedProviderApplication.provider.name,
    application: {
      id: context.id,
      sentToProvidersAt: context.sentToProvidersAt,
      staffApplication: context.staffApplication,
      providerApplications: context.providerApplications.map(
        (providerApplication) => ({
          id: providerApplication.id,
          subStage: providerApplication.subStage,
        }),
      ),
    },
  };
}

export async function findProviderResponseApplication(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderResponseApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: PROVIDER_RESPONSE_APPLICATION_SELECT,
  });
}

export function requireProviderResponseApplication(
  providerApp: ProviderApplicationForResponse | null,
  response: ProviderResponseType,
): ResolvedProviderApplicationForResponse {
  const resolved = resolveProviderApplicationForResponse(providerApp, response);
  if ("error" in resolved) {
    throw new TRPCError({
      code: resolved.error.code,
      message: resolved.error.message,
    });
  }

  return resolved.providerApp;
}

export function requireNoOpenInfoRequest(providerApp: {
  threads: Array<{ id: string } | undefined>;
}): void {
  if (providerApp.threads[0] != null) {
    throwInfoRequestBadRequest(
      INFO_REQUEST_BAD_REQUEST.OPEN_INFO_REQUEST_EXISTS,
    );
  }
}

/** INFO_NEEDED and REVOKE_CONDITIONAL_APPROVAL both carry a required message. */
export function requireResponseMessage(message?: string): string {
  const trimmedMessage = message?.trim();
  if (trimmedMessage == null || trimmedMessage.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: PROVIDER_RESPONSE_BAD_REQUEST.MESSAGE_REQUIRED,
    });
  }

  return trimmedMessage;
}

export function requireProviderResponseSubmission(
  context: ProviderResponseApplicationRow | null,
  providerId: string,
  response: ProviderResponseType,
): ResolvedProviderApplicationForResponse {
  if (context?.staffApplication != null) {
    assertStaffCaseModifiable(context.staffApplication.stage);
  }

  const resolvedProviderApp = requireProviderResponseApplication(
    mapProviderApplicationForResponse(context, providerId),
    response,
  );

  if (response === PROVIDER_RESPONSE_TYPE.INFO_NEEDED && context != null) {
    const ownedProviderApplication = findOwnedProviderApplication(
      context,
      providerId,
    );
    if (ownedProviderApplication != null) {
      requireNoOpenInfoRequest(ownedProviderApplication);
    }
  }

  return resolvedProviderApp;
}
