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

import {
  providerProcedure,
  router,
  staffProcedure,
} from "~@idaho-th/trpc/init";
import {
  staffTimelineApplicationSchema,
  timelineApplicationSchema,
} from "~@idaho-th/trpc/routes/timeline/timeline.schema";
import {
  getProviderTimeline,
  getStaffTimeline,
  markProviderModalOpened,
  markProviderTimelineViewed,
  markStaffModalOpened,
  markStaffTimelineViewed,
} from "~@idaho-th/trpc/routes/timeline/timeline.service";

export const timelineRouter = router({
  getForStaff: staffProcedure
    .input(staffTimelineApplicationSchema)
    .query(({ ctx, input }) =>
      getStaffTimeline(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
        input.includeProviderNotSelected,
      ),
    ),

  getForProvider: providerProcedure
    .input(timelineApplicationSchema)
    .query(({ ctx, input }) =>
      getProviderTimeline(ctx.prisma, ctx.providerId, input.applicationId),
    ),

  markViewedForStaff: staffProcedure
    .input(timelineApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      await markStaffTimelineViewed(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
      );
      return { success: true };
    }),

  markViewedForProvider: providerProcedure
    .input(timelineApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      await markProviderTimelineViewed(
        ctx.prisma,
        { providerId: ctx.providerId, providerUserId: ctx.providerUserId },
        input.applicationId,
      );
      return { success: true };
    }),

  markModalOpenedForStaff: staffProcedure
    .input(timelineApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      await markStaffModalOpened(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
      );
      return { success: true };
    }),

  markModalOpenedForProvider: providerProcedure
    .input(timelineApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      await markProviderModalOpened(
        ctx.prisma,
        { providerId: ctx.providerId, providerUserId: ctx.providerUserId },
        input.applicationId,
      );
      return { success: true };
    }),
});
