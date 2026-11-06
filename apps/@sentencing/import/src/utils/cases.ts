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

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { caseImportSchema } from "~@sentencing/import/models";
import {
  bulkUpsert,
  getOrCreateIdsByName,
  inBatches,
  lastRowPerKey,
} from "~@sentencing/import/utils/batching";
import { getMOCountyFullName } from "~@sentencing/import/utils/helpers";
import { PrismaClient, ReportType } from "~@sentencing/prisma/client";

const EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE = {
  "PSI Assigned Full": ReportType.FullPSI,
  "PSI File Review Assigned": ReportType.FileReview,
  "PSI File Review w/LSI Assigned": ReportType.FileReviewWithUpdatedLSIRScore,
};

const CANCELLED_STATUS = "Cancelled";

export async function transformAndLoadCaseData(
  prismaClient: PrismaClient,
  data: AsyncGenerator<z.infer<typeof caseImportSchema>>,
) {
  const staffExternalIds = new Set(
    (
      await prismaClient.staff.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  const clientExternalIds = new Set(
    (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId),
  );

  const countyIdsByName = new Map<string, string>();
  const districtIdsByName = new Map<string, string>();

  for await (const batch of inBatches(data)) {
    const cases = lastRowPerKey(batch, (caseData) => caseData.external_id);

    // Transform county abbreviation to full name for MO
    const countyName = (caseData: (typeof cases)[number]) =>
      caseData.county && caseData.state_code === "US_MO"
        ? getMOCountyFullName(caseData.county)
        : caseData.county;

    await getOrCreateIdsByName(
      prismaClient,
      "county",
      cases.flatMap((caseData) => {
        const name = countyName(caseData);
        return name ? [{ stateCode: caseData.state_code, name }] : [];
      }),
      countyIdsByName,
    );
    await getOrCreateIdsByName(
      prismaClient,
      "district",
      cases.flatMap((caseData) =>
        caseData.district
          ? [{ stateCode: caseData.state_code, name: caseData.district }]
          : [],
      ),
      districtIdsByName,
    );

    await bulkUpsert(prismaClient, {
      table: "Case",
      rows: cases.map((caseData) => ({
        externalId: caseData.external_id,
        // Prisma generates this id, not the database, so new rows need one.
        id: randomUUID(),
        stateCode: caseData.state_code,
        dueDate: caseData.due_date,
        lsirScore: caseData.lsir_score,
        lsirLevel: caseData.lsir_level,
        reportType: caseData.report_type
          ? EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE[caseData.report_type]
          : undefined,
        isLsirScoreLocked: caseData.lsir_score !== undefined,
        isReportTypeLocked: caseData.report_type !== undefined,
        isCountyLocked: Boolean(caseData.county),
        isCancelled: caseData.investigation_status === CANCELLED_STATUS,
        // The incoming data is the source of truth for staff and client, so a
        // case whose staff or client isn't in the database is unlinked. Ones
        // that haven't been imported yet are linked during their own import.
        staffId: staffExternalIds.has(caseData.staff_id)
          ? caseData.staff_id
          : null,
        clientId: clientExternalIds.has(caseData.client_id)
          ? caseData.client_id
          : null,
        countyId: countyIdsByName.get(
          countyName(caseData)?.toLowerCase() ?? "",
        ),
        // Only link a district when the case has no county, since the county's
        // district is the source of truth. Without a county or district from
        // the import, the district is cleared: the user will set a county, and
        // its district is used from then on.
        districtId:
          caseData.county || !caseData.district
            ? null
            : districtIdsByName.get(caseData.district.toLowerCase()),
      })),
      conflictColumns: ["externalId"],
      insertOnlyColumns: ["id"],
      // Fields missing from the import leave the current value in place, so a
      // county the user set isn't overridden.
      keepExistingWhenNull: [
        "dueDate",
        "lsirScore",
        "lsirLevel",
        "reportType",
        "countyId",
      ],
      updateExpressions: {
        // A case that already has a county gets no district, even when the
        // import has one. Checked in the same statement, so a county set while
        // the import runs is respected.
        districtId: `CASE WHEN "Case"."countyId" IS NOT NULL THEN NULL ELSE EXCLUDED."districtId" END`,
      },
    });
  }
}
