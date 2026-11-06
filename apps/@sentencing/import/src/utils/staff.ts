// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import z from "zod";

import { staffImportSchema } from "~@sentencing/import/models";
import {
  bulkUpdateText,
  bulkUpsert,
  getOrCreateIdsByName,
  inBatches,
  lastRowPerKey,
} from "~@sentencing/import/utils/batching";
import { getMODistrictFullName } from "~@sentencing/import/utils/helpers";
import { PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadStaffData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof staffImportSchema>>,
) {
  const existingCaseExternalIds = new Set(
    (
      await prismaClient.case.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );
  const districtIdsByName = new Map<string, string>();

  const supervisorUpdates: {
    externalId: string;
    supervisorId: string | null;
  }[] = [];

  // First pass: upsert all staff without supervisor connections so that all
  // records exist before we attempt to link them (supervisors may appear after
  // their direct reports in the source data).
  for await (const batch of inBatches(data)) {
    const staffBatch = lastRowPerKey(
      batch.filter((staffData) => {
        if (!staffData.full_name) {
          console.warn(
            `Skipping staff record ${staffData.external_id}: missing full_name.`,
          );
          return false;
        }
        return true;
      }),
      (staffData) => staffData.external_id,
    );

    const districtName = (staffData: (typeof staffBatch)[number]) =>
      staffData.state_code === "US_MO" && staffData.district
        ? getMODistrictFullName(staffData.district)
        : undefined;

    await getOrCreateIdsByName(
      prismaClient,
      "district",
      staffBatch.flatMap((staffData) => {
        const name = districtName(staffData);
        return name ? [{ stateCode: staffData.state_code, name }] : [];
      }),
      districtIdsByName,
    );

    await bulkUpsert(prismaClient, {
      table: "Staff",
      rows: staffBatch.map((staffData) => ({
        externalId: staffData.external_id,
        pseudonymizedId: staffData.pseudonymized_id,
        stateCode: staffData.state_code,
        fullName: staffData.full_name,
        email: staffData.email,
        supervisesAll: !!staffData.supervises_all,
        officeAddress: staffData.officeAddress,
        officePhoneNumber: staffData.officePhoneNumber,
        districtId: districtIdsByName.get(
          districtName(staffData)?.toLowerCase() ?? "",
        ),
      })),
      conflictColumns: ["externalId"],
      // A missing email, address, or district leaves the current one in place.
      keepExistingWhenNull: ["email", "officeAddress", "districtId"],
    });

    // Link each staff member to their cases that are already in the database.
    // Cases that haven't been imported yet are linked during the case import.
    await bulkUpdateText(prismaClient, {
      table: "Case",
      keyColumn: "externalId",
      rows: lastRowPerKey(
        staffBatch.flatMap((staffData) =>
          staffData.case_ids
            .filter((externalId) => existingCaseExternalIds.has(externalId))
            .map((externalId) => ({
              externalId,
              staffId: staffData.external_id,
            })),
        ),
        ({ externalId }) => externalId,
      ),
    });

    supervisorUpdates.push(
      ...staffBatch.map((staffData) => ({
        externalId: staffData.external_id,
        supervisorId: staffData.supervisor_id ?? null,
      })),
    );
  }

  // Second pass: now that all staff records exist, wire up (or clear) supervisor
  // links. A supervisor who isn't in the database leaves the current link in
  // place, so one bad reference doesn't affect anyone else.
  const supervisorIds = [
    ...new Set(
      supervisorUpdates.flatMap(({ supervisorId }) =>
        supervisorId ? [supervisorId] : [],
      ),
    ),
  ];
  const existingSupervisorIds = new Set(
    (
      await prismaClient.staff.findMany({
        where: { externalId: { in: supervisorIds } },
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );
  supervisorUpdates
    .filter(
      ({ supervisorId }) =>
        supervisorId && !existingSupervisorIds.has(supervisorId),
    )
    .forEach(({ externalId, supervisorId }) =>
      console.error(
        `Failed to update supervisor link for staff ${externalId}: supervisor ${supervisorId} not found`,
      ),
    );

  await bulkUpdateText(prismaClient, {
    table: "Staff",
    keyColumn: "externalId",
    rows: lastRowPerKey(
      supervisorUpdates.filter(
        ({ supervisorId }) =>
          !supervisorId || existingSupervisorIds.has(supervisorId),
      ),
      ({ externalId }) => externalId,
    ),
  });
}
