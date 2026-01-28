// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { captureException } from "@sentry/node";
import { TRPCError } from "@trpc/server";
import _ from "lodash";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing/prisma";
import { Prisma } from "~@sentencing/prisma/client";
import { handlePrismaError } from "~@sentencing/trpc/errors";
import { baseProcedure, router } from "~@sentencing/trpc/init";
import {
  getCaseInputSchema,
  updateCaseSchema,
} from "~@sentencing/trpc/routes/case/case.schema";
import { PRISMA_CASE_GET_ARGS } from "~@sentencing/trpc/routes/case/constants";
import { getInsightForCase } from "~@sentencing/trpc/routes/case/utils";

export const caseRouter = router({
  getCase: baseProcedure
    .input(getCaseInputSchema)
    .query(async ({ input: { id }, ctx: { prisma } }) => {
      const caseData = await prisma.case.findUnique({
        where: {
          id,
        },
        ...PRISMA_CASE_GET_ARGS,
      });

      if (!caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case with that id was not found",
        });
      }

      let insight = undefined;
      try {
        insight = await getInsightForCase(caseData, prisma);
      } catch (e) {
        // Log any errors but still return the case data
        captureException(e);
      }

      const {
        customDueDate,
        dueDate,
        offense,
        county,
        district,
        client,
        ...rest
      } = caseData;
      // move offense to top level and include insight
      return {
        ...rest,
        reportType: caseData.reportType,
        recommendedOpportunities: caseData.recommendedOpportunities.map(
          (opportunity) => ({
            ...opportunity,
            providerName:
              // Map these names back to null for the client
              opportunity.providerName === OPPORTUNITY_UNKNOWN_PROVIDER_NAME
                ? null
                : opportunity.providerName,
          }),
        ),
        dueDate: customDueDate ?? dueDate,
        offense: offense?.name,
        county: county?.name ?? null,
        district: district?.name ?? county?.district?.name ?? null,
        insight,
        client: client
          ? {
              ...client,
              county: client?.county?.name ?? null,
              district:
                client?.district?.name ??
                client?.county?.district?.name ??
                null,
            }
          : null,
      };
    }),
  updateCase: baseProcedure
    .input(updateCaseSchema)
    .mutation(async ({ input: { id, attributes }, ctx: { prisma } }) => {
      try {
        const { lsirScore, reportType, county, clientGender, clientCounty } =
          attributes;
        if (lsirScore || reportType || clientGender || county || clientCounty) {
          const {
            isLsirScoreLocked,
            isReportTypeLocked,
            isCountyLocked,
            client,
          } = await prisma.case.findUniqueOrThrow({
            where: {
              id,
            },
            select: {
              isLsirScoreLocked: true,
              isReportTypeLocked: true,
              isCountyLocked: true,
              client: {
                select: {
                  isGenderLocked: true,
                  isCountyLocked: true,
                },
              },
            },
          });

          if (lsirScore && isLsirScoreLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "LSIR score is locked and cannot be updated",
            });
          }

          if (reportType && isReportTypeLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Report type is locked and cannot be updated",
            });
          }

          if (county && isCountyLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "County is locked and cannot be updated",
            });
          }

          if (clientGender && client?.isGenderLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Client gender is locked and cannot be updated",
            });
          }
          if (clientCounty && client?.isCountyLocked) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Client county is locked and cannot be updated",
            });
          }
        }
      } catch (e) {
        handlePrismaError(e, "Case with that id was not found");
      }

      try {
        // Look up opportunity IDs by their compound unique key (opportunityName, providerName, district).
        // We do this because Prisma's generated TypeScript types for `set` operations don't work correctly
        // when a compound unique constraint includes a nullable field (district). Using `id` instead
        // of the compound key avoids the type issue while maintaining correct runtime behavior.
        let opportunityIds: { id: string }[] | undefined;
        if (attributes.recommendedOpportunities) {
          const opportunities = await Promise.all(
            attributes.recommendedOpportunities.map((opp) =>
              prisma.opportunity.findFirst({
                where: {
                  opportunityName: opp.opportunityName,
                  providerName: opp.providerName,
                  district: opp.district,
                },
                select: { id: true },
              }),
            ),
          );
          opportunityIds = opportunities.filter(
            (o): o is { id: string } => o !== null,
          );
        }

        const updateData: Prisma.CaseUpdateInput = {
          ..._.omit(attributes, ["district", "clientGender", "clientCounty"]),
          county: {
            connect: attributes.county
              ? {
                  name: attributes.county,
                }
              : undefined,
          },
          customDueDate: attributes.customDueDate,
          recommendedOpportunities: opportunityIds
            ? { set: opportunityIds.map((o) => ({ id: o.id })) }
            : undefined,
          offense: {
            connect: attributes.offense
              ? {
                  name: attributes.offense,
                }
              : undefined,
          },
          client: {
            update: {
              gender: attributes.clientGender,
              county: {
                connect: attributes.clientCounty
                  ? {
                      name: attributes.clientCounty,
                    }
                  : undefined,
              },
            },
          },
        };

        await prisma.case.update({
          where: {
            id,
          },
          data: updateData,
        });
      } catch (e) {
        handlePrismaError(e, "Case with that id was not found");
      }
    }),
});
