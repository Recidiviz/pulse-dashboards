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

import { captureMessage } from "@sentry/node";
import { parse as parseYaml } from "yaml";

import {
  AgencyConfig,
  AgencyConfigFileSchema,
  AgencyConfigSchema,
  BaseConfigFileSchema,
  MEETINGS_STATE_CODES,
  mergeWithBase,
} from "~@meetings/config";
import { getGlobalPrismaClient } from "~@meetings/prisma";
import { type AgencyConfig as AgencyConfigRow } from "~@meetings/prisma/client";

function mergeConfigRow(
  baseRow: Pick<AgencyConfigRow, "config">,
  row: Pick<AgencyConfigRow, "id" | "config" | "version">,
): AgencyConfig {
  const stateCode = row.id.toUpperCase();
  const rawBase = BaseConfigFileSchema.parse(parseYaml(baseRow.config));
  const rawAgency = AgencyConfigFileSchema.parse(parseYaml(row.config));
  const mergedConfig = AgencyConfigSchema.parse(
    mergeWithBase(rawBase, rawAgency),
  );

  // The row id is the trusted identity. The YAML's own stateCode should
  // always agree (enforced at save time). Prefer the row id on mismatch.
  if (mergedConfig.stateCode !== stateCode) {
    captureMessage(
      `AgencyConfig "${row.id}" declares stateCode "${mergedConfig.stateCode}", which does not match its row id. Using "${stateCode}" instead.`,
      {
        level: "error",
        tags: { agencyConfigId: row.id, agencyConfigVersion: row.version },
      },
    );
    mergedConfig.stateCode = stateCode;
  }

  return mergedConfig;
}

export async function getAgencyConfigs(): Promise<
  Record<string, AgencyConfig>
> {
  const prisma = getGlobalPrismaClient();
  const latestRows = await prisma.agencyConfig.findMany({
    distinct: ["id"],
    orderBy: { version: "desc" },
  });

  const configs: Record<string, AgencyConfig> = {};
  for (const row of latestRows) {
    if (!row.parentId) continue; // this row IS a base config, not an agency config

    const stateCode = row.id.toUpperCase();
    // MEETINGS_STATE_CODES is the source of truth for which states are
    // supported. Do not surface other states.
    if (!MEETINGS_STATE_CODES.includes(stateCode)) {
      continue;
    }

    const baseRow = latestRows.find((r) => r.id === row.parentId);
    if (!baseRow) {
      throw new Error(
        `AgencyConfig "${row.id}" references missing base "${row.parentId}"`,
      );
    }

    configs[stateCode] = mergeConfigRow(baseRow, row);
  }
  return Object.freeze(configs);
}

// Most places only need one state config at a time
export async function getAgencyConfig(
  stateCode: string,
): Promise<AgencyConfig | undefined> {
  if (!MEETINGS_STATE_CODES.includes(stateCode)) {
    return undefined;
  }

  const prisma = getGlobalPrismaClient();
  const row = await prisma.agencyConfig.findFirst({
    where: { id: stateCode.toLowerCase() },
    orderBy: { version: "desc" },
  });
  if (!row || !row.parentId) {
    return undefined;
  }

  const baseRow = await prisma.agencyConfig.findFirst({
    where: { id: row.parentId },
    orderBy: { version: "desc" },
  });
  if (!baseRow) {
    throw new Error(
      `AgencyConfig "${row.id}" references missing base "${row.parentId}"`,
    );
  }

  return mergeConfigRow(baseRow, row);
}
