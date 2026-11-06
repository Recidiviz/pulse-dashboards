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

import { z } from "zod";

import { clientImportSchema } from "~@sentencing/import/models";
import {
  bulkUpdateText,
  bulkUpsert,
  getOrCreateIdsByName,
  inBatches,
  lastRowPerKey,
} from "~@sentencing/import/utils/batching";
import { getMOCountyFullName } from "~@sentencing/import/utils/helpers";
import { Gender, PrismaClient } from "~@sentencing/prisma/client";

export async function transformAndLoadClientData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof clientImportSchema>>,
) {
  const existingCaseExternalIds = new Set(
    (
      await prismaClient.case.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );
  const countyIdsByName = new Map<string, string>();
  const districtIdsByName = new Map<string, string>();

  for await (const batch of inBatches(data)) {
    const clients = lastRowPerKey(
      batch,
      (clientData) => clientData.external_id,
    );

    // Transform county abbreviation to full name for MO
    const countyName = (clientData: (typeof clients)[number]) =>
      clientData.county && clientData.state_code === "US_MO"
        ? getMOCountyFullName(clientData.county)
        : clientData.county;

    // Both county and district can be set simultaneously (e.g., US_ID has both)
    await getOrCreateIdsByName(
      prismaClient,
      "county",
      clients.flatMap((clientData) => {
        const name = countyName(clientData);
        return name ? [{ stateCode: clientData.state_code, name }] : [];
      }),
      countyIdsByName,
    );
    await getOrCreateIdsByName(
      prismaClient,
      "district",
      clients.flatMap((clientData) =>
        clientData.district
          ? [{ stateCode: clientData.state_code, name: clientData.district }]
          : [],
      ),
      districtIdsByName,
    );

    await bulkUpsert(prismaClient, {
      table: "Client",
      rows: clients.map((clientData) => {
        const hasKnownGender =
          clientData.gender !== Gender.INTERNAL_UNKNOWN &&
          clientData.gender !== Gender.EXTERNAL_UNKNOWN;
        return {
          externalId: clientData.external_id,
          pseudonymizedId: clientData.pseudonymized_id,
          stateCode: clientData.state_code,
          fullName: clientData.full_name,
          birthDate: clientData.birth_date,
          // Race is already transformed to an array by the schema
          raceOrEthnicity: clientData.race.filter(
            (race) => race !== "EXTERNAL_UNKNOWN",
          ),
          gender: clientData.gender,
          isGenderLocked: hasKnownGender,
          isCountyLocked: Boolean(clientData.county),
          countyId: countyIdsByName.get(
            countyName(clientData)?.toLowerCase() ?? "",
          ),
          districtId: districtIdsByName.get(
            clientData.district?.toLowerCase() ?? "",
          ),
        };
      }),
      conflictColumns: ["externalId"],
      // A missing county or district leaves the current one in place.
      keepExistingWhenNull: ["countyId", "districtId"],
      updateExpressions: {
        // When updating, only change the gender if it's known
        gender: `CASE WHEN EXCLUDED."isGenderLocked" THEN EXCLUDED."gender" ELSE "Client"."gender" END`,
      },
    });

    // Link each client to their cases that are already in the database. Cases
    // that haven't been imported yet are linked during the case import.
    await bulkUpdateText(prismaClient, {
      table: "Case",
      keyColumn: "externalId",
      rows: lastRowPerKey(
        clients.flatMap((clientData) =>
          clientData.case_ids
            .filter((externalId) => existingCaseExternalIds.has(externalId))
            .map((externalId) => ({
              externalId,
              clientId: clientData.external_id,
            })),
        ),
        ({ externalId }) => externalId,
      ),
    });
  }
}
