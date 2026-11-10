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

import { type PrismaClient } from "~@idaho-th/prisma/client";
import { dismissAlert } from "~@idaho-th/trpc/routes/alert/alert.helpers";

import {
  findProviderApplicationDetail,
  getStaffApplicationDetail,
  requireProviderApplicationDetail,
} from "./applicationDetail.helpers";
import {
  mapProviderApplicationDetailFromRow,
  mapStaffApplicationDetailFromRow,
} from "./applicationDetail.mapper";
import type {
  ProviderApplicationDetail,
  StaffApplicationDetail,
} from "./applicationDetail.types";

export async function getStaffApplicationById(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  applicationId: string,
): Promise<StaffApplicationDetail> {
  const context = await getStaffApplicationDetail(
    prisma,
    applicationId,
    staffPseudonymizedId,
  );
  return mapStaffApplicationDetailFromRow(context);
}

export async function getProviderApplicationById(
  prisma: PrismaClient,
  providerId: string,
  applicationId: string,
): Promise<ProviderApplicationDetail> {
  const context = requireProviderApplicationDetail(
    await findProviderApplicationDetail(prisma, applicationId, providerId),
  );
  return mapProviderApplicationDetailFromRow(context);
}

/** Dismisses for the whole acting organization; a colleague's dismissal covers the team. */
export async function dismissProviderAlert(
  prisma: PrismaClient,
  providerId: string,
  providerPseudonymizedId: string,
  alertId: string,
): Promise<{ dismissed: boolean }> {
  return dismissAlert(prisma, alertId, { providerId }, providerPseudonymizedId);
}

export async function dismissStaffAlert(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  alertId: string,
): Promise<{ dismissed: boolean }> {
  return dismissAlert(
    prisma,
    alertId,
    { staffPseudonymizedId },
    staffPseudonymizedId,
  );
}
