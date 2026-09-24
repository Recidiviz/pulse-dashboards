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
import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { usNcResidentMetadataSchema } from "~datatypes";

import { isUserFlagActive } from "../../../../../helpers/featureFlags";
import { usNcStaffProcedure } from "../../../../../procedures/stateRestrictedStaffProcedureFactory";
import { getStatusOfExistingRNA, RNAAssessmentStatus } from "./rnaStatus";

const NC_TZ = "America/New_York";

// converts a Date to a PlainDate
function plainDueDate(datetime: Date | null | undefined) {
  if (!datetime) return;
  return Temporal.PlainDate.from({
    // because the due date has already been parsed to a date by our Zod schema,
    // we have to translate it to the PlainDate API. This is safe regardless of
    // what time zone we are running in, parsing alone would not change the date
    year: datetime.getFullYear(),
    month: datetime.getMonth() + 1,
    day: datetime.getDate(),
  });
}

const residentRecordFields = z.object({
  pseudonymizedId: z.string(),
  // note this is assuming only NC records will be fetched
  metadata: usNcResidentMetadataSchema,
});

function validateCurrentRNA<T extends { createdAt: Date }>(
  rnaDueDate: Temporal.PlainDate | undefined,
  latestRNA: T,
) {
  const now = new Date();

  // within this window, older assessments are considered stale
  const rnaWindowStart = rnaDueDate
    ? rnaDueDate.subtract({ days: 90 }).toZonedDateTime(NC_TZ)
    : undefined;

  const isWithinRNAWindow = rnaWindowStart
    ? now.getTime() >= rnaWindowStart.epochMilliseconds
    : false;

  if (
    isWithinRNAWindow &&
    // this will always be true if isWithinRNAWindow is, but typescript can't infer that
    rnaWindowStart
  ) {
    if (latestRNA.createdAt.getTime() >= rnaWindowStart.epochMilliseconds) {
      // the latest RNA is fresh
      return latestRNA;
    }
    // the latest RNA is stale
    return undefined;
  }
  // we don't care about freshness here
  return latestRNA;
}

/**
 * Returns RNA status details for all residents matching the input query specs
 */
export const rnaStatusList = usNcStaffProcedure
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
        rnaDueDate: Temporal.PlainDate | undefined;
      }>;

      if (
        await isUserFlagActive({
          prisma,
          flagId: "useNewResidentData",
          userIdFromAuthProvider: userId,
          stateCode,
          // permissions in this app do not apply to staff
          userPermissions: undefined,
        })
      ) {
        residentData = (
          await prisma.resident.findMany({
            where: { [lookupField]: { in: lookupValue } },
            select: { pseudonymizedId: true, stateSpecificData: true },
          })
        ).map(({ pseudonymizedId, stateSpecificData }) => {
          const { rnaDueDate } =
            usNcResidentMetadataSchema.parse(stateSpecificData);
          return { pseudonymizedId, rnaDueDate: plainDueDate(rnaDueDate) };
        });
      } else {
        // resident data is in Firestore, which we need to map this request to resident IDs
        const residentsQuery = firestoreCurrentStateQuerier("residents")
          .where(lookupField, "in", lookupValue)
          .select("pseudonymizedId", "metadata");

        residentData = (await residentsQuery.get()).docs.map((d) => {
          const {
            pseudonymizedId,
            metadata: { rnaDueDate },
          } = residentRecordFields.parse(d.data());
          return { pseudonymizedId, rnaDueDate: plainDueDate(rnaDueDate) };
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
          submittedByStaffAt: true,
          enabledAt: true,
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
          submittedByStaffAt?: Date;
          enabledAt?: Date;
        } => {
          const { pseudonymizedId, rnaDueDate } = r;

          const latestRNA = latestRNAByResident.get(pseudonymizedId);

          let currentRNA;
          if (latestRNA) {
            currentRNA = validateCurrentRNA(rnaDueDate, latestRNA);
          }

          // if a resident has never filled out an assessment,
          // or if their latest assessment is not fresh, staff needs to enable a new one
          if (!latestRNA || !currentRNA) {
            let status: RNAAssessmentStatus;

            if (!rnaDueDate) {
              status = "UPCOMING";
            } else {
              // comparing due date to today as calendar dates, not timestamps
              const today = Temporal.Now.plainDateISO(NC_TZ);
              // the person's status becomes "DUE" when the due date is in the past or today
              status =
                Temporal.PlainDate.compare(rnaDueDate, today) < 1
                  ? "DUE"
                  : "UPCOMING";
            }

            return {
              pseudonymizedId,
              status,
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
            enabledAt: currentRNA.enabledAt ?? undefined,
          };
        },
      );
    },
  );
