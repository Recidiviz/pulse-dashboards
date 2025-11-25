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

import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { Prisma } from "~@sentencing/prisma/client";
import { baseProcedure, router } from "~@sentencing/trpc/init";
import {
  getSARInputSchema,
  updateSarSchema,
} from "~@sentencing/trpc/routes/sar/sar.schema";

export const sarRouter = router({
  getSAR: baseProcedure
    .input(getSARInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const sarData = await prisma.sentencingAssessmentReport.findUnique({
        where: {
          id,
        },
        omit: {
          staffId: true,
          clientId: true,
          createdAt: true,
          updatedAt: true,
        },
        include: {
          charges: {
            omit: {
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
            include: {
              offense: {
                select: {
                  name: true,
                },
              },
            },
          },
          drugHistories: {
            omit: {
              id: true,
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          client: {
            select: {
              fullName: true,
              gender: true,  // Returned for display but not editable (state data)
              ssn: true,
              externalId: true, 
              birthDate: true,  // Returned for display but not editable (state data)
            },
          },
        },
      });

      if (!sarData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentencing Assessment Report with that id was not found",
        });
      }

      // Flatten the response
      return {
        ...sarData,
        charges: sarData.charges.map((charge) => ({
          ...charge,
          offense: charge.offense?.name ?? null,
        })),
      };
    }),
  updateSar: baseProcedure
    .input(updateSarSchema)
    .mutation(async ({ input: { id, attributes }, ctx: { prisma } }) => {
      try {
        const {
          ssn,
          motherName,
          fatherName,
          guardianName,
          charges,
          drugHistories,
        } = attributes;

        const updateData: Prisma.SentencingAssessmentReportUpdateInput = {
          ..._.omit(attributes, [
            "ssn",
            "motherName",
            "fatherName",
            "guardianName",
            "charges",
            "drugHistories",
          ]),
        };

        // Cast metadata to Prisma's InputJsonValue if provided.
        // Explanation: Prisma stores JSON data and expects type `InputJsonValue` (any valid JSON).
        // Our `SARMetadata` type is a specific structured object (sections, statuses, etc.).
        // Even though our structure IS valid JSON, TypeScript doesn't automatically know
        // that `SARMetadata` is compatible with `InputJsonValue`.
        // The cast tells TypeScript: "This specific structure is valid JSON that Prisma can store."
        // The Zod schema (`sarMetadataSchema`) still validates the structure at runtime.
        if (attributes.metadata !== undefined) {
          updateData.metadata = attributes.metadata as Prisma.InputJsonValue;
        }

        // Update client fields if provided
        const clientUpdateFields: Prisma.ClientUpdateInput = {};
        if (ssn !== undefined) clientUpdateFields.ssn = ssn;
        if (motherName !== undefined)
          clientUpdateFields.motherName = motherName;
        if (fatherName !== undefined)
          clientUpdateFields.fatherName = fatherName;
        if (guardianName !== undefined)
          clientUpdateFields.guardianName = guardianName;

        if (Object.keys(clientUpdateFields).length > 0) {
          updateData.client = {
            update: clientUpdateFields,
          };
        }

        // Handle charges - upsert by ID to preserve imported charges
        if (charges !== undefined && charges !== null) {
          updateData.charges = {
            update: charges.map((charge) => ({
              where: { id: charge.id },
              data: {
                prosecutingAttorney: charge.prosecutingAttorney,
                defenseAttorney: charge.defenseAttorney,
                pleaAgreement: charge.pleaAgreement,
                pleaDate: charge.pleaDate,
                sentencingDate: charge.sentencingDate,
              },
            })),
          };
        }

        // Handle drug histories - delete all and recreate if provided
        if (drugHistories !== undefined && drugHistories !== null) {
          const mapped = drugHistories.map((history) => {
            return {
              substance: history.substance,
              ageOfRegularUse: history.ageOfRegularUse,
              lastUse: history.lastUse,
              heaviestUse: history.heaviestUse,
              method: history.method,
            };
          });

          updateData.drugHistories = {
            deleteMany: {},
            create: mapped,
          };
        }

        await prisma.sentencingAssessmentReport.update({
          where: { id },
          data: updateData,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sentencing Assessment Report with that id was not found",
            cause: e,
          });
        }

        throw e;
      }
    }),
});
