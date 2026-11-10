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

import type { z } from "zod";

import type {
  ApplicationSubStage,
  Prisma,
  PrismaClient,
} from "~@idaho-th/prisma/client";

import type {
  editProviderInfoRequestMessageSchema,
  getProviderInfoRequestSchema,
  getStaffInfoRequestSchema,
  markStaffInfoMessagesReadSchema,
  postStaffInfoReplySchema,
} from "./infoRequest.schema";
import {
  INFO_REQUEST_WITH_MESSAGES_SELECT,
  OPEN_INFO_REQUEST_FOR_EDIT_SELECT,
  OPEN_INFO_REQUEST_ID_SELECT,
  OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT,
  providerOwnedApplicationSelect,
  staffInfoReplySelect,
  staffProviderApplicationSelect,
} from "./infoRequest.selects";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type InfoRequestWithMessages =
  Prisma.ProviderApplicationThreadGetPayload<{
    select: typeof INFO_REQUEST_WITH_MESSAGES_SELECT;
  }>;

export type StaffProviderApplicationRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<
    typeof staffProviderApplicationSelect<typeof OPEN_INFO_REQUEST_ID_SELECT>
  >;
}>;

export type StaffInfoRequestRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<
    typeof staffProviderApplicationSelect<
      typeof OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT
    >
  >;
}>;

export type ProviderInfoRequestRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<
    typeof providerOwnedApplicationSelect<
      typeof OPEN_INFO_REQUEST_WITH_MESSAGES_SELECT
    >
  >;
}>;

export type ProviderInfoEditRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<
    typeof providerOwnedApplicationSelect<
      typeof OPEN_INFO_REQUEST_FOR_EDIT_SELECT
    >
  >;
}>;

export type StaffInfoReplyRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<typeof staffInfoReplySelect>;
}>;

export type ResolvedProviderInfoRequest = {
  applicationId: string;
  providerApplicationId: string;
  infoRequests: InfoRequestWithMessages[];
};

export type ResolvedProviderInfoEdit = {
  applicationId: string;
  providerApplicationId: string;
  infoRequestId: string;
  editableMessage: {
    id: string;
    body: string;
    originalBody: string | null;
  };
};

export type ResolvedStaffInfoRequest = {
  applicationId: string;
  providerApplicationId: string;
  infoRequest: InfoRequestWithMessages | null;
};

export type ResolvedStaffInfoReply = {
  applicationId: string;
  providerApplicationId: string;
  infoRequestId: string;
  providerId: string;
  providerName: string;
  providerApplications: Array<{ id: string; subStage: ApplicationSubStage }>;
};

export type GetProviderInfoRequestInput = z.infer<
  typeof getProviderInfoRequestSchema
>;
export type EditProviderInfoRequestMessageInput = z.infer<
  typeof editProviderInfoRequestMessageSchema
>;
export type GetStaffInfoRequestInput = z.infer<
  typeof getStaffInfoRequestSchema
>;
export type PostStaffInfoReplyInput = z.infer<typeof postStaffInfoReplySchema>;
export type MarkStaffInfoMessagesReadInput = z.infer<
  typeof markStaffInfoMessagesReadSchema
>;
