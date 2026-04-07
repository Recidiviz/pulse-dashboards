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

import {
  getRNAWindow,
  validateCurrentRNA,
} from "../../../../../helpers/US_NC/rna";
import { dateStringSchemaWithoutTimeShift } from "../../../../../helpers/zod";
import { getStatusOfExistingRNA, RNAAssessmentStatus } from "./rnaStatus";
import { stateStaffProcedure } from "./stateStaffProcedure";

// minimal schema for the fields we need, since we can't directly import from datatypes
// due to Vite dependencies
const residentRecordFields = z.object({
  pseudonymizedId: z.string(),
  // note this is assuming only NC records will be fetched
  metadata: z.object({
    stateCode: z.literal("US_NC"),
    rnaDueDate: dateStringSchemaWithoutTimeShift,
  }),
});

/**
 * Returns RNA status details for all residents matching the input query specs
 */
export const rnaStatusList = stateStaffProcedure
  .input(
    z.object({
      lookupField: z.enum(["officerId", "facilityId"]),
      lookupValue: z.array(z.string()),
    }),
  )
  .query(
    async ({
      ctx: { prisma, firestoreCurrentStateQuerier },
      input: { lookupField, lookupValue },
    }) => {
      // resident data is in Firestore, which we need to map this request to resident IDs
      const residentsQuery = firestoreCurrentStateQuerier("residents")
        .where(lookupField, "in", lookupValue)
        .select("pseudonymizedId", "metadata");

      const residents = (await residentsQuery.get()).docs.map((d) =>
        residentRecordFields.parse(d.data()),
      );

      const allRNARecords = await prisma.usNcRNA.findMany({
        where: {
          pseudonymizedId: { in: residents.map((r) => r.pseudonymizedId) },
        },
        select: {
          id: true,
          pseudonymizedId: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          answers: true,
          submittedByStaffAt: true,
        },
        // we only want the most recent for each person,
        // this will help us filter for that in memory
        orderBy: {
          updatedAt: "desc",
        },
      });

      const latestRNAByResident = rollup(
        allRNARecords,
        // first item is most recent because the query sorted them
        (v) => v[0],
        // group by person
        (r) => r.pseudonymizedId,
      );

      // compute a status for each resident and include applicable assessment data
      return residents.map(
        (
          r,
        ): {
          pseudonymizedId: string;
          status: RNAAssessmentStatus;
          id?: string;
          updatedAt?: Date;
          createdAt?: Date;
          completedAt?: Date;
          submittedByStaffAt?: Date;
          enabledAt: Date;
        } => {
          const {
            pseudonymizedId,
            metadata: { rnaDueDate },
          } = r;
          const latestRNA = latestRNAByResident.get(pseudonymizedId);

          let currentRNA;
          if (latestRNA) {
            currentRNA = validateCurrentRNA(rnaDueDate, latestRNA);
          }

          const { rnaWindowStart, isWithinRNAWindow } =
            getRNAWindow(rnaDueDate);

          // if a resident has never filled out an assessment, or if their latest
          // assessment is not fresh, they'll see a new one when they open the app
          if (!latestRNA || !currentRNA) {
            // the person's status goes from "UPCOMING" to "NOT_STARTED" once it's
            // within 90 days of the due date
            const status = isWithinRNAWindow ? "NOT_STARTED" : "UPCOMING";

            return {
              pseudonymizedId,
              status,
              enabledAt: rnaWindowStart,
            };
          }

          return {
            pseudonymizedId,
            status: getStatusOfExistingRNA(currentRNA),
            id: currentRNA.id,
            updatedAt: currentRNA.updatedAt,
            createdAt: currentRNA.createdAt,
            // coalescing nulls to undefined just to simplify the output type,
            // the distinction between them is not important
            completedAt: currentRNA.completedAt ?? undefined,
            submittedByStaffAt: currentRNA.submittedByStaffAt ?? undefined,
            enabledAt: rnaWindowStart,
          };
        },
      );
    },
  );
