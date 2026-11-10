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

import { MessageSenderType, ThreadType } from "~@idaho-th/prisma/client";
import { compareProviderApplicationSubStages } from "~@idaho-th/trpc/routes/housing-common/applicationProgression";
import { toHousingProviderContact } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";

import type {
  ApplicationProvider,
  ProviderApplicationRow,
} from "./applicationProviders.types";

// Threads arrive newest first, so the first revoke thread is the latest one.
function toApprovalRevoked(
  threads: ProviderApplicationRow["threads"],
): ApplicationProvider["approvalRevoked"] {
  const latestRevoke = threads.find(
    (thread) => thread.type === ThreadType.CONDITIONAL_APPROVAL_REVOKED,
  );
  const reason = latestRevoke?.messages.find(
    (message) => message.senderType === MessageSenderType.PROVIDER,
  );
  return reason ? { message: reason.body, createdAt: reason.createdAt } : null;
}

export function mapProviderApplicationRow(
  providerApplication: ProviderApplicationRow,
): ApplicationProvider {
  return {
    providerApplicationId: providerApplication.id,
    providerId: providerApplication.providerId,
    providerName: providerApplication.provider.name,
    contact: toHousingProviderContact(providerApplication.provider),
    stage: providerApplication.stage,
    subStage: providerApplication.subStage,
    status: providerApplication.status,
    createdAt: providerApplication.createdAt,
    providerLocation: providerApplication.providerLocation,
    infoRequests: providerApplication.threads.filter(
      (thread) => thread.type === ThreadType.INFO_REQUEST,
    ),
    approvalRevoked: toApprovalRevoked(providerApplication.threads),
  };
}

export function sortApplicationProviders(
  providers: ApplicationProvider[],
): ApplicationProvider[] {
  return [...providers].sort((a, b) => {
    const bySubStage = compareProviderApplicationSubStages(
      a.subStage,
      b.subStage,
    );
    if (bySubStage !== 0) {
      return bySubStage;
    }

    return a.providerName.localeCompare(b.providerName);
  });
}
