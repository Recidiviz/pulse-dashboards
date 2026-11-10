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

import { ApplicationSubStage } from "~@idaho-th/prisma/client";
import { HOUSING_APPLICATION_ERRORS } from "~@idaho-th/shared";
import { HOUSING_APPLICATION_NOT_FOUND } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { assertStaffCaseModifiable } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  buildApplicationWhereForProvider,
  requireProviderOwnedApplication,
  requireStaffOwnsApplication,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";

import {
  INFO_REQUESTS_WITH_MESSAGES_SELECT,
  type InfoRequestThreadArgs,
  OPEN_INFO_REQUEST_FOR_EDIT_SELECT,
  OPEN_INFO_REQUEST_ID_SELECT,
  OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT,
  providerOwnedApplicationSelect,
  staffInfoReplySelect,
  staffProviderApplicationSelect,
} from "./infoRequest.selects";
import type {
  DbClient,
  ProviderInfoEditRow,
  ProviderInfoRequestRow,
  ResolvedProviderInfoEdit,
  ResolvedProviderInfoRequest,
  ResolvedStaffInfoReply,
  ResolvedStaffInfoRequest,
  StaffInfoReplyRow,
  StaffInfoRequestRow,
  StaffProviderApplicationRow,
} from "./infoRequest.types";

export const INFO_REQUEST_NOT_FOUND = {
  ...HOUSING_APPLICATION_NOT_FOUND,
  OPEN_INFO_REQUEST: "No open information request found for this application",
} as const;

export const INFO_REQUEST_BAD_REQUEST = {
  NOT_SENT_TO_PROVIDERS: HOUSING_APPLICATION_ERRORS.NOT_SENT_TO_PROVIDERS,
  NOT_INFO_NEEDED: "Application is not in an information request state",
  MESSAGE_NOT_EDITABLE:
    "Cannot edit the information request after it has been read by staff",
  OPEN_INFO_REQUEST_EXISTS: HOUSING_APPLICATION_ERRORS.OPEN_INFO_REQUEST_EXISTS,
} as const;

export function throwInfoRequestNotFound(
  message: (typeof INFO_REQUEST_NOT_FOUND)[keyof typeof INFO_REQUEST_NOT_FOUND],
): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export function throwInfoRequestBadRequest(
  message: (typeof INFO_REQUEST_BAD_REQUEST)[keyof typeof INFO_REQUEST_BAD_REQUEST],
): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

type ProviderApplicationWithOpenInfoRequest = {
  threads: Array<{ id: string } | undefined>;
};

type StaffInfoReplyProviderApplication =
  StaffInfoReplyRow["providerApplications"][number];

/**
 * The one place a provider info-request read is scoped. `providerId` is the
 * verified active organization: the application is reached through its match to
 * that organization, and the threads through that same match.
 */
async function findProviderOwnedApplication<
  TInfoRequestsSelect extends InfoRequestThreadArgs,
>(
  client: DbClient,
  applicationId: string,
  providerId: string,
  infoRequestsSelect: TInfoRequestsSelect,
) {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: providerOwnedApplicationSelect(providerId, infoRequestsSelect),
  });
}

export function requireProviderApplication<
  TProviderApplications extends readonly { id: string }[],
>(context: {
  providerApplications: TProviderApplications;
}): NonNullable<TProviderApplications[number]> {
  const providerApp = context.providerApplications[0];
  if (providerApp != null) {
    return providerApp;
  }
  throwInfoRequestNotFound(INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION);
}

export function requireOpenInfoRequestId(
  providerApp: ProviderApplicationWithOpenInfoRequest,
): string {
  const openInfoRequest = providerApp.threads[0];
  if (openInfoRequest != null) {
    return openInfoRequest.id;
  }
  throwInfoRequestNotFound(INFO_REQUEST_NOT_FOUND.OPEN_INFO_REQUEST);
}

export function requireApplicationSentToProviders(
  sentToProvidersAt: Date | null,
): void {
  if (sentToProvidersAt == null) {
    throwInfoRequestBadRequest(INFO_REQUEST_BAD_REQUEST.NOT_SENT_TO_PROVIDERS);
  }
}

export function requireProviderOnInfoNeeded(
  subStage: ApplicationSubStage,
): void {
  if (subStage !== ApplicationSubStage.INFO_NEEDED) {
    throwInfoRequestBadRequest(INFO_REQUEST_BAD_REQUEST.NOT_INFO_NEEDED);
  }
}

export async function findProviderInfoRequest(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderInfoRequestRow | null> {
  return findProviderOwnedApplication(
    client,
    applicationId,
    providerId,
    INFO_REQUESTS_WITH_MESSAGES_SELECT,
  );
}

export async function findProviderInfoEdit(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderInfoEditRow | null> {
  return findProviderOwnedApplication(
    client,
    applicationId,
    providerId,
    OPEN_INFO_REQUEST_FOR_EDIT_SELECT,
  );
}

export function resolveProviderInfoRequest(
  context: ProviderInfoRequestRow | null,
): ResolvedProviderInfoRequest {
  if (context != null) {
    const providerApp = requireProviderOwnedApplication(
      context.providerApplications,
    );

    return {
      applicationId: context.id,
      providerApplicationId: providerApp.id,
      infoRequests: providerApp.threads,
    };
  }

  throwInfoRequestNotFound(
    INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
  );
}

export async function loadProviderInfoRequest(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ResolvedProviderInfoRequest> {
  return resolveProviderInfoRequest(
    await findProviderInfoRequest(client, applicationId, providerId),
  );
}

export function requireProviderInfoEdit(
  context: ProviderInfoEditRow | null,
): ResolvedProviderInfoEdit {
  if (context != null) {
    const providerApp = requireProviderOwnedApplication(
      context.providerApplications,
    );
    requireProviderOnInfoNeeded(providerApp.subStage);

    const infoRequest = providerApp.threads[0];
    if (infoRequest == null) {
      throwInfoRequestNotFound(INFO_REQUEST_NOT_FOUND.OPEN_INFO_REQUEST);
    }

    const editableMessage = infoRequest.messages[0];
    if (editableMessage != null) {
      return {
        applicationId: context.id,
        providerApplicationId: providerApp.id,
        infoRequestId: infoRequest.id,
        editableMessage,
      };
    }

    throwInfoRequestBadRequest(INFO_REQUEST_BAD_REQUEST.MESSAGE_NOT_EDITABLE);
  }

  throwInfoRequestNotFound(
    INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
  );
}

export async function findStaffProviderApplication(
  client: DbClient,
  applicationId: string,
  providerApplicationId: string,
): Promise<StaffProviderApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      providerApplications: { some: { id: providerApplicationId } },
    },
    select: staffProviderApplicationSelect(
      providerApplicationId,
      OPEN_INFO_REQUEST_ID_SELECT,
    ),
  });
}

export async function findStaffInfoRequest(
  client: DbClient,
  applicationId: string,
  providerApplicationId: string,
): Promise<StaffInfoRequestRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      providerApplications: { some: { id: providerApplicationId } },
    },
    select: staffProviderApplicationSelect(
      providerApplicationId,
      OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT,
    ),
  });
}

export function resolveStaffInfoRequest(
  context: StaffInfoRequestRow | null,
  staffPseudonymizedId: string,
): ResolvedStaffInfoRequest {
  requireStaffOwnsApplication<StaffInfoRequestRow>(
    context,
    staffPseudonymizedId,
  );

  const providerApp = requireProviderApplication(context);

  return {
    applicationId: context.id,
    providerApplicationId: providerApp.id,
    infoRequest: providerApp.threads[0] ?? null,
  };
}

export async function getStaffOpenInfoRequest(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
  providerApplicationId: string,
) {
  const context = await findStaffProviderApplication(
    client,
    applicationId,
    providerApplicationId,
  );
  requireStaffOwnsApplication<StaffProviderApplicationRow>(
    context,
    staffPseudonymizedId,
  );

  const providerApp = requireProviderApplication(context);
  return {
    providerApplicationId: providerApp.id,
    infoRequestId: requireOpenInfoRequestId(providerApp),
  };
}

export async function findStaffInfoReply(
  client: DbClient,
  applicationId: string,
  providerApplicationId: string,
): Promise<StaffInfoReplyRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      providerApplications: { some: { id: providerApplicationId } },
    },
    select: staffInfoReplySelect(),
  });
}

function requireTargetProviderApplication(
  providerApplications: StaffInfoReplyProviderApplication[],
  providerApplicationId: string,
): StaffInfoReplyProviderApplication {
  const providerApp = providerApplications.find(
    (application) => application.id === providerApplicationId,
  );
  if (providerApp != null) {
    return providerApp;
  }
  throwInfoRequestNotFound(INFO_REQUEST_NOT_FOUND.PROVIDER_APPLICATION);
}

export function requireStaffInfoReply(
  context: StaffInfoReplyRow | null,
  staffPseudonymizedId: string,
  providerApplicationId: string,
): ResolvedStaffInfoReply {
  requireStaffOwnsApplication<StaffInfoReplyRow>(context, staffPseudonymizedId);

  const staffApplication = context.staffApplication;
  if (staffApplication == null) {
    throwInfoRequestNotFound(INFO_REQUEST_NOT_FOUND.STAFF_APPLICATION);
  }

  assertStaffCaseModifiable(staffApplication.stage);
  requireApplicationSentToProviders(context.sentToProvidersAt);

  const providerApp = requireTargetProviderApplication(
    context.providerApplications,
    providerApplicationId,
  );
  requireProviderOnInfoNeeded(providerApp.subStage);

  return {
    applicationId: context.id,
    providerApplicationId: providerApp.id,
    infoRequestId: requireOpenInfoRequestId(providerApp),
    // The organization the thread belongs to, read off the match row — the
    // timeline event is scoped to it.
    providerId: providerApp.providerId,
    providerName: providerApp.provider.name,
    providerApplications: context.providerApplications.map(
      (providerApplication) => ({
        id: providerApplication.id,
        subStage: providerApplication.subStage,
      }),
    ),
  };
}
