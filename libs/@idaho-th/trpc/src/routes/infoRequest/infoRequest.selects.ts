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
  MessageSenderType,
  type Prisma,
  ThreadStatus,
  ThreadType,
} from "~@idaho-th/prisma/client";

/** Scopes every info-request query to its own thread type. */
export const INFO_REQUEST_THREAD_WHERE = {
  type: ThreadType.INFO_REQUEST,
} as const;

/** Thread args that must carry the info-request type filter. */
export type InfoRequestThreadArgs =
  Prisma.ProviderApplicationThreadFindManyArgs & {
    where: typeof INFO_REQUEST_THREAD_WHERE;
  };

export const OPEN_INFO_REQUEST_THREAD_WHERE = {
  ...INFO_REQUEST_THREAD_WHERE,
  status: ThreadStatus.OPEN,
} as const;

export const INFO_REQUEST_MESSAGES_SELECT = {
  id: true,
  senderType: true,
  senderPseudonymizedId: true,
  body: true,
  originalBody: true,
  editedAt: true,
  readAt: true,
  createdAt: true,
} as const;

export const INFO_REQUEST_WITH_MESSAGES_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  messages: {
    select: INFO_REQUEST_MESSAGES_SELECT,
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export const OPEN_INFO_REQUEST_ID_SELECT = {
  where: OPEN_INFO_REQUEST_THREAD_WHERE,
  select: { id: true },
  take: 1,
} as const;

export const OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT = {
  where: OPEN_INFO_REQUEST_THREAD_WHERE,
  select: INFO_REQUEST_WITH_MESSAGES_SELECT,
  take: 1,
} as const;

export const INFO_REQUESTS_WITH_MESSAGES_SELECT = {
  where: INFO_REQUEST_THREAD_WHERE,
  select: INFO_REQUEST_WITH_MESSAGES_SELECT,
  orderBy: { createdAt: "desc" as const },
} as const;

export const EDITABLE_PROVIDER_MESSAGE_SELECT = {
  id: true,
  body: true,
  originalBody: true,
} as const;

export const OPEN_INFO_REQUEST_FOR_EDIT_SELECT = {
  where: OPEN_INFO_REQUEST_THREAD_WHERE,
  select: {
    id: true,
    messages: {
      where: {
        senderType: MessageSenderType.PROVIDER,
        readAt: null,
      },
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: EDITABLE_PROVIDER_MESSAGE_SELECT,
    },
  },
  take: 1,
} as const;

export function staffProviderApplicationSelect<
  TInfoRequestsSelect extends InfoRequestThreadArgs,
>(providerApplicationId: string, infoRequestsSelect: TInfoRequestsSelect) {
  return {
    id: true,
    staffApplication: {
      select: { staffPseudonymizedId: true },
    },
    providerApplications: {
      where: { id: providerApplicationId },
      select: {
        id: true,
        threads: infoRequestsSelect,
      },
    },
  } satisfies Prisma.HousingApplicationSelect;
}

/**
 * The application's thread as the active organization sees it. `providerId` is
 * the verified active organization from `ctx.providerId`: colleagues answer one
 * shared request, and a person managing two organizations must not reach the
 * other one's threads while acting as this one.
 */
export function providerOwnedApplicationSelect<
  TInfoRequestsSelect extends InfoRequestThreadArgs,
>(providerId: string, infoRequestsSelect: TInfoRequestsSelect) {
  return {
    id: true,
    providerApplications: {
      where: { providerId },
      select: {
        id: true,
        subStage: true,
        threads: infoRequestsSelect,
      },
    },
  } satisfies Prisma.HousingApplicationSelect;
}

export function staffInfoReplySelect() {
  return {
    id: true,
    sentToProvidersAt: true,
    staffApplication: {
      select: { staffPseudonymizedId: true, stage: true },
    },
    providerApplications: {
      select: {
        id: true,
        providerId: true,
        subStage: true,
        // The organization only — its people are HousingProviderUser rows now.
        provider: { select: { name: true } },
        threads: OPEN_INFO_REQUEST_ID_SELECT,
      },
    },
  } satisfies Prisma.HousingApplicationSelect;
}
