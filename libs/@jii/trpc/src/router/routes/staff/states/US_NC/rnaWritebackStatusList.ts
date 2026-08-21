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

import { rollup } from "d3-array";
import { z } from "zod";

import { isUserFlagActive } from "../../../../../helpers/featureFlags";
import { latestRNAIsStale } from "../../../../../helpers/US_NC/rna";
import { RNAAssessmentStatus } from "./rnaStatus";
import { stateStaffProcedure } from "./stateStaffProcedure";

const residentRecordSchema = z.object({
  pseudonymizedId: z.string(),
});

/**
 * Returns RNA status details for all residents matching the input query specs,
 * based on writeback data.
 */
export const rnaWritebackStatusList = stateStaffProcedure
  .input(
    z.object({
      lookupField: z.enum(["officerId", "facilityId"]),
      lookupValue: z.array(z.string()),
    }),
  )
  .query(
    async ({
      ctx: { prisma, firestoreCurrentStateQuerier, userId, stateCode },
      input: { lookupField, lookupValue },
    }) => {
      let residentData: Array<{
        pseudonymizedId: string;
      }>;

      if (
        await isUserFlagActive({
          prisma,
          flagId: "useNewResidentData",
          userIdFromAuthProvider: userId,
          stateCode,
        })
      ) {
        residentData = await prisma.resident.findMany({
          where: { [lookupField]: { in: lookupValue } },
          select: { pseudonymizedId: true },
        });
      } else {
        // resident data is in Firestore, which we need to map this request to resident IDs
        const residentsQuery = firestoreCurrentStateQuerier("residents")
          .where(lookupField, "in", lookupValue)
          .select("pseudonymizedId");

        residentData = (await residentsQuery.get()).docs.map((d) => {
          return residentRecordSchema.parse(d.data());
        });
      }

      const allRNARecords = await prisma.usNcRNA.findMany({
        where: {
          pseudonymizedId: { in: residentData.map((r) => r.pseudonymizedId) },
        },
        select: {
          id: true,
          pseudonymizedId: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          answers: true,
          seqNumber: true,
          admitDate: true,
          submittedByStaffAt: true,
        },
        // we only want the most recent for each person,
        // this will help us filter for that in memory
        orderBy: {
          updatedAt: "desc",
        },
      });

      const allRNAWritebackData = await prisma.usNcRNAWritebackData.findMany({
        where: {
          pseudonymizedId: { in: residentData.map((r) => r.pseudonymizedId) },
        },
        select: {
          pseudonymizedId: true,
          seqNumber: true,
          admitDate: true,
        },
        orderBy: {
          importedAt: "desc",
        },
      });

      const latestRNAByResident = rollup(
        allRNARecords,
        // first item is most recent because the query sorted them
        (v) => v[0],
        // group by person
        (r) => r.pseudonymizedId,
      );

      const writebackDataByResident = rollup(
        allRNAWritebackData,
        (v) => {
          return { seqNumber: v[0].seqNumber, admitDate: v[0].admitDate };
        },
        (r) => r.pseudonymizedId,
      );

      // compute a status for each resident and include applicable assessment data
      return residentData.map(
        (
          r,
        ): {
          pseudonymizedId: string;
          status: RNAAssessmentStatus;
          id?: string;
          updatedAt?: Date;
          createdAt?: Date;
          completedAt?: Date;
          seqNumber?: string;
          admitDate?: Date;
        } => {
          const { pseudonymizedId } = r;
          const latestRNA = latestRNAByResident.get(pseudonymizedId);
          const { seqNumber, admitDate } =
            writebackDataByResident.get(pseudonymizedId) ?? {};

          let status: RNAAssessmentStatus = "UPCOMING";

          if (seqNumber) {
            // non-null sequence number means a currently open RNA in OPUS, which
            // can be at any stage of progress
            if (
              !latestRNA ||
              latestRNAIsStale({ latestRNA, seqNumber, admitDate })
            ) {
              status = "NOT_STARTED";
            } else if (latestRNA.completedAt) {
              status = "COMPLETE";
            } else {
              status = "IN_PROGRESS";
            }
          } else if (latestRNA?.completedAt) {
            // closed RNA was completed, and person hasn't had a new sequence number yet

            if (!latestRNA?.seqNumber && latestRNA?.submittedByStaffAt) {
              // edge case covering pre-writeback RNAs which can also be "submitted"
              status = "SUBMITTED_BY_STAFF";
            } else {
              status = "COMPLETE";
            }
          }

          return {
            pseudonymizedId,
            status: status,
            id: latestRNA?.id,
            updatedAt: latestRNA?.updatedAt,
            createdAt: latestRNA?.createdAt,
            // coalescing nulls to undefined just to simplify the output type,
            // the distinction between them is not important
            completedAt: latestRNA?.completedAt ?? undefined,
          };
        },
      );
    },
  );
