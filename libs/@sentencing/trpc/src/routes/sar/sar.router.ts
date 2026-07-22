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

import { Prisma, PrismaClient } from "~@sentencing/prisma/client";
import { handlePrismaError } from "~@sentencing/trpc/errors";
import { baseProcedure, router } from "~@sentencing/trpc/init";
import { getSARInsight } from "~@sentencing/trpc/routes/common/utils";
import {
  createDrugHistorySchema,
  createEmploymentHistorySchema,
  createPriorTreatmentHistorySchema,
  deleteDrugHistorySchema,
  deleteEmploymentHistorySchema,
  deletePriorTreatmentHistorySchema,
  getSARByIDInputSchema,
  getSARInsightSchema,
  getSARsByClientInputSchema,
  getSARsForStaffInputSchema,
  ORAS_FIELDS,
  updateDrugHistorySchema,
  updateEmploymentHistorySchema,
  updatePriorTreatmentHistorySchema,
  updateSARSchema,
} from "~@sentencing/trpc/routes/sar/sar.schema";
import {
  buildSARStaffFilter,
  canAccessSARAssignee,
  fetchStaffById,
  resolveAssignedTo,
  sarAccessFilter,
} from "~@sentencing/trpc/routes/staff/staff.helpers";

// Any manual create/update/delete of an employment history record means fresh
// MOCIS imports should no longer overwrite this SAR's employment history —
// see hasManuallyUpdatedEmploymentHistory on SentencingAssessmentReport.
function markEmploymentHistoryManuallyUpdated(
  prisma: Prisma.TransactionClient,
  sarId: string,
) {
  return prisma.sentencingAssessmentReport.update({
    where: { id: sarId },
    data: { hasManuallyUpdatedEmploymentHistory: true },
  });
}

// Once MODOC closes the investigation in OPII, any PO can view/download the
// SAR -- not just its assignee or their supervisor. Reaching `status`
// Complete in-app isn't enough on its own; that happens before OPII closes.
// Mirrors the frontend's isSARArchived (~@sentencing/trpc-types), which this
// can't import -- @sentencing/trpc-types already imports AppRouter from
// @sentencing/trpc, so importing it back here would be a circular dependency.
function isArchivedInOpii(sar: { completionDate: Date | null }): boolean {
  return !!sar.completionDate;
}

// Throws FORBIDDEN unless the given SAR is accessible to staffPseudonymizedId
// (its assignee or their district/org-wide supervisor). No staffPseudonymizedId
// means an internal user, who is unrestricted -- same convention as every
// other SAR route via `sarAccessFilter`. Shared by every mutation that
// operates directly on a SAR id.
async function assertSARAccessible(
  prisma: PrismaClient,
  sarId: string,
  staffPseudonymizedId: string | undefined,
): Promise<void> {
  if (!staffPseudonymizedId) return;

  const accessible = await prisma.sentencingAssessmentReport.findFirst({
    where: {
      id: sarId,
      ...(await sarAccessFilter(prisma, staffPseudonymizedId)),
    },
    select: { id: true },
  });
  if (!accessible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this Sentencing Assessment Report",
    });
  }
}

// Throws FORBIDDEN unless `findRecord` resolves to a record. No
// staffPseudonymizedId means an internal user, who is unrestricted, so
// `findRecord` is skipped entirely rather than called. Shared by the history
// CRUD mutations, which each look up their child record (employment/drug/
// prior-treatment history) scoped to an accessible SAR via its own delegate
// -- `findRecord` supplies that delegate-specific lookup, this just owns the
// shared "unrestricted, or not found under this scope" handling.
async function assertAccessible(
  findRecord: () => Promise<{ id: string } | null>,
  label: string,
  staffPseudonymizedId: string | undefined,
): Promise<void> {
  if (!staffPseudonymizedId) return;

  const accessible = await findRecord();
  if (!accessible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You do not have access to this ${label}`,
    });
  }
}

export const sarRouter = router({
  getSARInsight: baseProcedure
    .input(getSARInsightSchema)
    .query(
      async ({
        input: { offenseName, gender, assessmentScoreBucket },
        ctx: { prisma },
      }) => {
        return await getSARInsight(
          offenseName,
          gender,
          assessmentScoreBucket,
          prisma,
        );
      },
    ),

  getSAR: baseProcedure
    .input(getSARByIDInputSchema)
    .query(async ({ input: { id }, ctx: { prisma, staffPseudonymizedId } }) => {
      // Fold ownership check into the main query — one round trip instead of two.
      // Archived SARs are also readable regardless of assignment (isArchivedInOpii),
      // so a Tasks supervision officer can download a client's finished SAR from
      // their profile page. Editing endpoints don't get this carve-out.
      // No staffPseudonymizedId means an internal user, who is unrestricted --
      // handled as a separate branch rather than spreading `sarAccessFilter`'s `{}`
      // into the OR array below, since an empty object there isn't a no-op match.
      const sarData = await prisma.sentencingAssessmentReport.findFirst({
        where: staffPseudonymizedId
          ? {
              id,
              OR: [
                { completionDate: { not: null } },
                await sarAccessFilter(prisma, staffPseudonymizedId),
              ],
            }
          : { id },
        omit: {
          staffId: true,
          clientId: true,
          createdAt: true,
        },
        include: {
          staff: {
            select: {
              externalId: true,
              pseudonymizedId: true,
              fullName: true,
              email: true,
              officeAddress: true,
              officePhoneNumber: true,
              district: {
                select: {
                  name: true,
                },
              },
            },
          },
          charges: {
            omit: {
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          drugHistories: {
            omit: {
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          employmentHistories: {
            omit: {
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          priorTreatmentHistories: {
            omit: {
              createdAt: true,
              updatedAt: true,
              sentencingAssessmentReportId: true,
            },
          },
          client: {
            select: {
              fullName: true,
              gender: true, // Returned for display but not editable (state data)
              raceOrEthnicity: true, // Returned for display but not editable (state data)
              externalId: true,
              birthDate: true, // Returned for display but not editable (state data)
              motherName: true,
              fatherName: true,
              guardianName: true,
              DOCTreatmentHistories: {
                select: {
                  id: true,
                  programCategory: true,
                  programName: true,
                  completedOn: true,
                },
              },
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

      return sarData;
    }),

  getSARsForStaff: baseProcedure
    .input(getSARsForStaffInputSchema)
    .query(
      async ({
        input: { staffPseudonymizedId: requestedPseudonymizedId },
        ctx: { prisma, staffPseudonymizedId },
      }) => {
        // Regular users: JWT-derived staffPseudonymizedId is always used for scoping.
        // Recidiviz internal users: no JWT pseudo ID, so fall back to requestedPseudonymizedId
        // to support impersonation. One of the two must resolve -- there is no
        // legitimate unrestricted case.
        const lookupId = staffPseudonymizedId ?? requestedPseudonymizedId;
        if (!lookupId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "A staffPseudonymizedId is required to look up SARs for staff",
          });
        }

        const staff = await fetchStaffById(prisma, lookupId);
        const staffFilter = buildSARStaffFilter(staff);

        const sars = await prisma.sentencingAssessmentReport.findMany({
          where: { staff: staffFilter },
          select: {
            id: true,
            status: true,
            dueDate: true,
            courtDate: true,
            completionDate: true,
            staff: {
              select: {
                pseudonymizedId: true,
                fullName: true,
              },
            },
            client: {
              select: {
                externalId: true,
                fullName: true,
              },
            },
          },
        });

        return sars.map(({ staff: sarStaff, ...rest }) => ({
          ...rest,
          assignedTo: resolveAssignedTo(
            sarStaff?.pseudonymizedId,
            staffPseudonymizedId,
            sarStaff?.fullName,
          ),
        }));
      },
    ),

  // Returns the SARs for a given client. Called from a client's profile page in
  // Tasks/Workflows, where the caller supervises the client but isn't necessarily
  // the PSI officer assigned to their SAR -- so every row is returned regardless
  // of caller. `currentUserHasAccess` (archived in OPII, or normal SAR access via
  // `canAccessSARAssignee`) tells the Tasks FE whether to render a link; if not,
  // the row still shows as plain status text. State isolation is already handled
  // upstream by the per-state Prisma client, so no extra scoping is needed here.
  getSARsByClient: baseProcedure
    .input(getSARsByClientInputSchema)
    .query(
      async ({
        input: { clientExternalId },
        ctx: { prisma, staffPseudonymizedId },
      }) => {
        // Independent of each other (requestingStaff is only consumed below
        // in the per-row currentUserHasAccess computation, not in the query's
        // `where`) so run them concurrently instead of round-tripping twice.
        const [requestingStaff, sars] = await Promise.all([
          staffPseudonymizedId
            ? fetchStaffById(prisma, staffPseudonymizedId)
            : undefined,
          prisma.sentencingAssessmentReport.findMany({
            where: {
              clientId: clientExternalId,
            },
            select: {
              id: true,
              externalId: true,
              status: true,
              completionDate: true,
              updatedAt: true,
              staff: {
                select: {
                  pseudonymizedId: true,
                  districtId: true,
                },
              },
            },
          }),
        ]);

        return sars.map(({ staff, ...rest }) => {
          // Deliberately not the "no requestingStaff means an internal user,
          // who is unrestricted" convention used elsewhere in this file: this
          // field decides whether the Tasks FE renders a working link, and an
          // internal user has no real assignee/supervisor relationship to
          // anything, so exempting them here would defeat the whole point of
          // gating the link to the assignee or their supervisor.
          const currentUserHasAccess =
            isArchivedInOpii(rest) ||
            (!!requestingStaff && canAccessSARAssignee(requestingStaff, staff));

          return {
            ...rest,
            staff: staff ? { pseudonymizedId: staff.pseudonymizedId } : null,
            currentUserHasAccess,
          };
        });
      },
    ),

  updateSAR: baseProcedure
    .input(updateSARSchema)
    .mutation(
      async ({
        input: { id, attributes },
        ctx: { prisma, staffPseudonymizedId },
      }) => {
        await assertSARAccessible(prisma, id, staffPseudonymizedId);

        try {
          const { motherName, fatherName, guardianName, charges } = attributes;

          const updateData: Prisma.SentencingAssessmentReportUpdateInput = {
            ..._.omit(attributes, [
              "motherName",
              "fatherName",
              "guardianName",
              "charges",
            ]),
          };

          if (ORAS_FIELDS.some((f) => attributes[f] !== undefined)) {
            updateData.ORASEnteredManually = true;
            updateData.ORASLastUpdatedAt = new Date();
          }

          // Cast metadata to Prisma's InputJsonValue if provided.
          // Explanation: Prisma stores JSON data and expects type `InputJsonValue` (any valid JSON).
          // Our `SARMetadata` type is a specific structured object (sections, statuses, etc.).
          // Even though our structure IS valid JSON, TypeScript doesn't automatically know
          // that `SARMetadata` is compatible with `InputJsonValue`.
          // The cast tells TypeScript: "This specific structure is valid JSON that Prisma can store."
          // The Zod schema (`SARMetadataSchema`) still validates the structure at runtime.
          if (attributes.metadata !== undefined) {
            updateData.metadata = attributes.metadata as Prisma.InputJsonValue;
          }

          // Update client fields if provided
          const clientUpdateFields: Prisma.ClientUpdateInput = {};
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

          await prisma.sentencingAssessmentReport.update({
            where: { id },
            data: updateData,
          });
        } catch (e) {
          handlePrismaError(
            e,
            "Sentencing Assessment Report with that id was not found",
          );
        }
      },
    ),

  // Employment History CRUD mutations
  createEmploymentHistory: baseProcedure
    .input(createEmploymentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertSARAccessible(prisma, input.sarId, staffPseudonymizedId);

      try {
        const { sarId, ...data } = input;
        const [created] = await prisma.$transaction([
          prisma.employmentHistory.create({
            data: {
              ...data,
              sentencingAssessmentReportId: sarId,
            },
          }),
          markEmploymentHistoryManuallyUpdated(prisma, sarId),
        ]);
        return created;
      } catch (e) {
        handlePrismaError(
          e,
          "Sentencing Assessment Report with that id was not found",
        );
      }
    }),

  updateEmploymentHistory: baseProcedure
    .input(updateEmploymentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.employmentHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "employment history record",
        staffPseudonymizedId,
      );

      try {
        const { id, ...data } = input;
        return await prisma.employmentHistory.update({
          where: { id },
          data: {
            ...data,
            sentencingAssessmentReport: {
              update: { hasManuallyUpdatedEmploymentHistory: true },
            },
          },
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Employment history record with that id was not found",
        );
      }
    }),

  deleteEmploymentHistory: baseProcedure
    .input(deleteEmploymentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.employmentHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "employment history record",
        staffPseudonymizedId,
      );

      try {
        // Interactive transaction so we can flag the parent SAR using the
        // sarId off the deleted row, without a separate lookup query first.
        return await prisma.$transaction(async (tx) => {
          const deleted = await tx.employmentHistory.delete({
            where: { id: input.id },
          });
          await markEmploymentHistoryManuallyUpdated(
            tx,
            deleted.sentencingAssessmentReportId,
          );
          return deleted;
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Employment history record with that id was not found",
        );
      }
    }),

  // Substance Use History CRUD mutations
  createDrugHistory: baseProcedure
    .input(createDrugHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertSARAccessible(prisma, input.sarId, staffPseudonymizedId);

      try {
        const { sarId, ...data } = input;
        return await prisma.drugHistory.create({
          data: {
            ...data,
            sentencingAssessmentReportId: sarId,
          },
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Sentencing Assessment Report with that id was not found",
        );
      }
    }),

  updateDrugHistory: baseProcedure
    .input(updateDrugHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.drugHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "substance use history record",
        staffPseudonymizedId,
      );

      try {
        const { id, ...data } = input;
        return await prisma.drugHistory.update({
          where: { id },
          data,
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Substance use history record with that id was not found",
        );
      }
    }),

  deleteDrugHistory: baseProcedure
    .input(deleteDrugHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.drugHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "substance use history record",
        staffPseudonymizedId,
      );

      try {
        return await prisma.drugHistory.delete({
          where: { id: input.id },
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Substance use history record with that id was not found",
        );
      }
    }),

  // Prior Treatment History CRUD mutations
  createPriorTreatmentHistory: baseProcedure
    .input(createPriorTreatmentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertSARAccessible(prisma, input.sarId, staffPseudonymizedId);

      try {
        const { sarId, ...data } = input;
        return await prisma.priorTreatmentHistory.create({
          data: {
            ...data,
            sentencingAssessmentReportId: sarId,
          },
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Sentencing Assessment Report with that id was not found",
        );
      }
    }),

  updatePriorTreatmentHistory: baseProcedure
    .input(updatePriorTreatmentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.priorTreatmentHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "prior treatment history record",
        staffPseudonymizedId,
      );

      try {
        const { id, ...data } = input;
        return await prisma.priorTreatmentHistory.update({
          where: { id },
          data,
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Prior treatment history record with that id was not found",
        );
      }
    }),

  deletePriorTreatmentHistory: baseProcedure
    .input(deletePriorTreatmentHistorySchema)
    .mutation(async ({ input, ctx: { prisma, staffPseudonymizedId } }) => {
      await assertAccessible(
        async () =>
          prisma.priorTreatmentHistory.findFirst({
            where: {
              id: input.id,
              sentencingAssessmentReport: await sarAccessFilter(
                prisma,
                staffPseudonymizedId,
              ),
            },
            select: { id: true },
          }),
        "prior treatment history record",
        staffPseudonymizedId,
      );

      try {
        return await prisma.priorTreatmentHistory.delete({
          where: { id: input.id },
        });
      } catch (e) {
        handlePrismaError(
          e,
          "Prior treatment history record with that id was not found",
        );
      }
    }),
});
