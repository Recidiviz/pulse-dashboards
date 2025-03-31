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

import { PrismaClient, ReportType } from "@prisma/sentencing-server/client";
import { z } from "zod";

import { caseImportSchema } from "~@sentencing/import/models";

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
  // Load new case data
  // We do this in an for loop instead of Promise.all to avoid a prisma pool connection error
  for await (const caseData of data) {
    const staffExternalIds = (
      await prismaClient.staff.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId);

    const clientExternalIds = (
      await prismaClient.client.findMany({
        select: { externalId: true },
      })
    ).map(({ externalId }) => externalId);

    // Check if the staff and clients exist in the db - if not, we'll link
    // them later
    const staffId = staffExternalIds.find((id) => id === caseData.staff_id);
    const clientId = clientExternalIds.find((id) => id === caseData.client_id);

    const newCase = {
      externalId: caseData.external_id,
      stateCode: caseData.state_code,
      dueDate: caseData.due_date,
      lsirScore: caseData.lsir_score,
      lsirLevel: caseData.lsir_level,
      reportType: caseData.report_type
        ? EXTERNAL_REPORT_TYPE_TO_INTERNAL_REPORT_TYPE[caseData.report_type]
        : null,
      isLsirScoreLocked: caseData.lsir_score !== undefined,
      isReportTypeLocked: caseData.report_type !== undefined,
      isCountyLocked: Boolean(caseData.county),
      isCancelled: caseData.investigation_status === CANCELLED_STATUS,
    };

    const createStaffConnection = staffId
      ? {
          connect: {
            externalId: staffId,
          },
        }
      : undefined;
    const createClientConnection = clientId
      ? {
          connect: {
            externalId: clientId,
          },
        }
      : undefined;
    const createCountyConnection = caseData.county
      ? {
          connectOrCreate: {
            where: {
              stateCode: caseData.state_code,
              name: caseData.county,
            },
            create: {
              stateCode: caseData.state_code,
              name: caseData.county,
            },
          },
        }
      : undefined;
    const createDistrictConnection =
      !caseData.county && caseData.district
        ? {
            connectOrCreate: {
              where: {
                stateCode: caseData.state_code,
                name: caseData.district,
              },
              create: {
                stateCode: caseData.state_code,
                name: caseData.district,
              },
            },
          }
        : undefined;

    // For staff and client, since the incoming data is the source of truth, we can disconnect if there is no associated staffId or clientId
    const updateStaffConnection = staffId
      ? {
          connect: {
            externalId: staffId,
          },
        }
      : {
          disconnect: true,
        };
    const updateClientConnection = clientId
      ? {
          connect: {
            externalId: clientId,
          },
        }
      : {
          disconnect: true,
        };
    // If we don't ingest a county, do nothing so we don't override the county the user sets
    const updateCountyConnection = caseData.county
      ? {
          connectOrCreate: {
            where: {
              stateCode: caseData.state_code,
              name: caseData.county,
            },
            create: {
              stateCode: caseData.state_code,
              name: caseData.county,
            },
          },
        }
      : undefined;

    const existingCase = await prismaClient.case.findUnique({
      where: {
        externalId: caseData.external_id,
      },
      include: {
        county: true,
      },
    });

    // Disconnect the district if we have a county, since the district connected to the county will be the source of truth
    // If we don't ingest a district, we can disconnect it too because we'll create a county or the user will set a county at which point,
    // we'll use the district connected to the county as the source of truth
    const updateDistrictConnection =
      existingCase?.county || caseData.county || !caseData.district
        ? { disconnect: true }
        : {
            connectOrCreate: {
              where: {
                stateCode: caseData.state_code,
                name: caseData.district,
              },
              create: {
                stateCode: caseData.state_code,
                name: caseData.district,
              },
            },
          };

    // Load data
    await prismaClient.case.upsert({
      where: {
        externalId: newCase.externalId,
      },
      create: {
        ...newCase,
        staff: createStaffConnection,
        client: createClientConnection,
        county: createCountyConnection,
        district: createDistrictConnection,
      },
      update: {
        ...newCase,
        staff: updateStaffConnection,
        client: updateClientConnection,
        county: updateCountyConnection,
        district: updateDistrictConnection,
      },
    });
  }
}
