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

import type { AlertType, Prisma, PrismaClient } from "~@idaho-th/prisma/client";
import {
  ALERT_METADATA_SCHEMA,
  ALERT_VISIBLE_DAYS,
  type VisibleAlert,
} from "~@idaho-th/shared";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { subtractDays } from "~@idaho-th/trpc/routes/housing-common/applicationRecordQuery";

const log = getLogger("alert.helpers");

type DbClient = Prisma.TransactionClient | PrismaClient;

export type AlertRecipient =
  | { providerId: string }
  | { staffPseudonymizedId: string };

/** Throws (writing nothing) when metadata does not match the type's schema. */
function validateMetadata(
  type: AlertType,
  metadata: unknown,
): Prisma.InputJsonObject | undefined {
  const schema = ALERT_METADATA_SCHEMA[type];
  if (schema === null) {
    if (metadata != null) {
      throw new Error(`Alert type ${type} carries no metadata`);
    }
    return undefined;
  }
  return schema.parse(metadata);
}

export async function createAlerts(
  client: DbClient,
  {
    type,
    applicationId,
    recipients,
    metadata,
  }: {
    type: AlertType;
    applicationId: string;
    recipients: AlertRecipient[];
    metadata?: unknown;
  },
): Promise<void> {
  const validMetadata = validateMetadata(type, metadata);

  await client.alert.createMany({
    data: recipients.map((recipient) => ({
      type,
      applicationId,
      metadata: validMetadata,
      providerId: "providerId" in recipient ? recipient.providerId : null,
      staffPseudonymizedId:
        "staffPseudonymizedId" in recipient
          ? recipient.staffPseudonymizedId
          : null,
    })),
  });
}

/**
 * Dismisses every live alert of `type` on the application, for all recipients:
 * a newer event replaces them. The actor is recorded so "superseded" can be
 * told apart from a recipient's own dismissal.
 */
export async function supersedeAlerts(
  client: DbClient,
  {
    type,
    applicationId,
    dismissedByPseudonymizedId,
  }: {
    type: AlertType;
    applicationId: string;
    dismissedByPseudonymizedId: string;
  },
): Promise<void> {
  await client.alert.updateMany({
    where: { applicationId, type, dismissedAt: null },
    data: { dismissedAt: new Date(), dismissedByPseudonymizedId },
  });
}

export const ALERT_SELECT = {
  id: true,
  type: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AlertSelect;

export type AlertRow = Prisma.AlertGetPayload<{ select: typeof ALERT_SELECT }>;

/** Null when the stored metadata does not match the type's schema. */
function parseAlert({ id, type, metadata }: AlertRow): VisibleAlert | null {
  switch (type) {
    case "RELEASE_DATE_CHANGED": {
      const parsed =
        ALERT_METADATA_SCHEMA.RELEASE_DATE_CHANGED.safeParse(metadata);
      return parsed.success ? { id, type, metadata: parsed.data } : null;
    }
    case "SELECTED_AS_HOME_PLAN":
    case "NEW_APPLICATION":
      return metadata === null ? { id, type, metadata: null } : null;
  }
}

export function toVisibleAlerts(
  rows: AlertRow[],
  now: Date = new Date(),
): VisibleAlert[] {
  const visibleAlerts: VisibleAlert[] = [];

  for (const row of rows) {
    const visibleDays = ALERT_VISIBLE_DAYS[row.type];
    if (
      visibleDays !== null &&
      row.createdAt < subtractDays(now, visibleDays)
    ) {
      continue;
    }

    const alert = parseAlert(row);
    if (alert === null) {
      log.warning("Dropped alert with invalid metadata", { alertId: row.id });
      continue;
    }

    visibleAlerts.push(alert);
  }

  return visibleAlerts;
}

/**
 * `recipientWhere` always comes from the verified ctx, so a caller can only
 * dismiss its own alerts. Zero matched rows is not an error: a repeat
 * dismiss is harmless, and throwing would reveal which ids exist.
 */
export async function dismissAlert(
  client: DbClient,
  alertId: string,
  recipientWhere: AlertRecipient,
  dismissedByPseudonymizedId: string,
): Promise<{ dismissed: boolean }> {
  const { count } = await client.alert.updateMany({
    where: { id: alertId, dismissedAt: null, ...recipientWhere },
    data: { dismissedAt: new Date(), dismissedByPseudonymizedId },
  });

  return { dismissed: count > 0 };
}
