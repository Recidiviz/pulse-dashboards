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
import { isAfter, subDays } from "date-fns";
import { isEmpty } from "lodash-es";
import { z } from "zod";

import { dateStringSchemaWithoutTimeShift } from "../../../../../helpers/zod";
import { router } from "../../../../../procedures/init";
import { stateRestrictedStaffProcedureFactory } from "../../../../../procedures/stateRestrictedStaffProcedureFactory";

const stateProcedure = stateRestrictedStaffProcedureFactory("US_NC");

// minimal schema for the fields we need, since we can't directly import from datatypes
// due to Vite dependencies
const residentRecordFields = z.object({
  pseudonymizedId: z.string(),
  // note this is assuming only NC records will be fetched
  metadata: z.object({
    stateCode: z.literal("US_NC"),
    rnaDueDate: dateStringSchemaWithoutTimeShift.nullish(),
  }),
});

const assessmentStatus = z.enum([
  "UPCOMING",
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETE",
]);

function validateCurrentRNA<T extends { createdAt: Date }>(
  rnaDueDate: Date | null | undefined,
  latestRNA: T,
) {
  const now = new Date();

  // within this window, older assessments are considered stale
  const rnaWindowStart = rnaDueDate ? subDays(rnaDueDate, 90) : undefined;
  const isWithinRNAWindow = rnaWindowStart
    ? isAfter(now, rnaWindowStart)
    : false;
  if (
    isWithinRNAWindow &&
    // this will always be true if isWithinRNAWindow is, but typescript can't infer that
    rnaWindowStart
  ) {
    if (isAfter(latestRNA.createdAt, rnaWindowStart)) {
      // the latest RNA is fresh
      return latestRNA;
    }
    // the latest RNA is stale
    return undefined;
  }
  // we don't care about freshness here
  return latestRNA;
}

export const usNcStaffRouter = router({
  rnaStatusList: stateProcedure
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
            pseudonymizedId: true,
            completed: true,
            createdAt: true,
            updatedAt: true,
            answers: true,
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
            status: z.infer<typeof assessmentStatus>;
            updatedAt?: Date;
          } => {
            const {
              pseudonymizedId,
              metadata: { rnaDueDate },
            } = r;
            const latestRNA = latestRNAByResident.get(pseudonymizedId);
            // if a resident has never filled out an assessment
            // they are considered Upcoming regardless of due date
            if (!latestRNA)
              return {
                pseudonymizedId,
                status: assessmentStatus.enum.UPCOMING,
              };

            const currentRNA = validateCurrentRNA(rnaDueDate, latestRNA);

            // if no fresh assessment, staff needs to enable a new one
            if (!currentRNA)
              return {
                pseudonymizedId,
                status: assessmentStatus.enum.UPCOMING,
              };

            if (currentRNA.completed)
              return {
                pseudonymizedId,
                status: assessmentStatus.enum.COMPLETE,
                updatedAt: currentRNA.updatedAt,
              };

            if (!isEmpty(currentRNA.answers))
              return {
                pseudonymizedId,
                status: assessmentStatus.enum.IN_PROGRESS,
                updatedAt: currentRNA.updatedAt,
              };

            return {
              pseudonymizedId,
              status: assessmentStatus.enum.NOT_STARTED,
              updatedAt: currentRNA.updatedAt,
            };
          },
        );
      },
    ),
});
