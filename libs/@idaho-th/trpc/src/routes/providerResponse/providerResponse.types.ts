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
  ApplicationStatus,
  ApplicationSubStage,
  Prisma,
  PrismaClient,
} from "~@idaho-th/prisma/client";
import type { ProviderResponseType } from "~@idaho-th/shared";

import type { PROVIDER_RESPONSE_APPLICATION_SELECT } from "./providerResponse.selects";

export type { ProviderApplicationForResponse } from "~@idaho-th/trpc/routes/housing-common/applicationProgression";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type ProviderResponseApplicationRow =
  Prisma.HousingApplicationGetPayload<{
    select: typeof PROVIDER_RESPONSE_APPLICATION_SELECT;
  }>;

export type ProviderResponseTransactionClient = Prisma.TransactionClient;

export type ProviderResponseState = {
  staffSubStage: ApplicationSubStage;
  staffStatus: ApplicationStatus;
};

export type ProviderResponseSubmitResult = ProviderResponseState & {
  applicationId: string;
  response: ProviderResponseType;
  statusMessage: string;
  message?: string;
  /** The thread the response opened: an info request, or a revoke note. */
  threadId?: string;
};

export type ProviderResponseSideEffectInput = {
  providerApplicationId: string;
  providerPseudonymizedId: string;
  message?: string;
};

export type ProviderResponseSideEffectResult = Pick<
  ProviderResponseSubmitResult,
  "message" | "threadId"
>;

export type ProviderResponseSideEffectHandler = (
  tx: ProviderResponseTransactionClient,
  context: ProviderResponseSideEffectInput,
) => Promise<ProviderResponseSideEffectResult>;
