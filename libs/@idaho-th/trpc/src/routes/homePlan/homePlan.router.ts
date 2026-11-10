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
  acceptProviderAsHomePlanSchema,
  getHomePlanSchema,
  setApprovalsSchema,
  setManualAddressHomePlanSchema,
  toggleReleaseTaskSchema,
  updateReleaseTaskDetailSchema,
} from "~@idaho-th/trpc/routes/homePlan/homePlan.schema";
import {
  acceptProviderAsHomePlan,
  getProviderHomePlan,
  getStaffHomePlan,
  setHomePlanApprovals,
  setManualAddressHomePlan,
  toggleProviderHomePlanReleaseTask,
  toggleStaffHomePlanReleaseTask,
  updateProviderHomePlanReleaseTaskDetail,
  updateStaffHomePlanReleaseTaskDetail,
} from "~@idaho-th/trpc/routes/homePlan/homePlan.service";

export const homePlanRouter = router({
  getStaffHomePlan: staffProcedure
    .input(getHomePlanSchema)
    .query(({ ctx, input }) =>
      getStaffHomePlan(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  getProviderHomePlan: providerProcedure
    .input(getHomePlanSchema)
    .query(({ ctx, input }) =>
      getProviderHomePlan(ctx.prisma, ctx.providerId, input),
    ),

  acceptProviderAsHomePlan: staffProcedure
    .input(acceptProviderAsHomePlanSchema)
    .mutation(({ ctx, input }) =>
      acceptProviderAsHomePlan(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  setManualAddressHomePlan: staffProcedure
    .input(setManualAddressHomePlanSchema)
    .mutation(({ ctx, input }) =>
      setManualAddressHomePlan(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  setHomePlanApprovals: staffProcedure
    .input(setApprovalsSchema)
    .mutation(({ ctx, input }) =>
      setHomePlanApprovals(ctx.prisma, ctx.staffPseudonymizedId, input),
    ),

  toggleStaffHomePlanReleaseTask: staffProcedure
    .input(toggleReleaseTaskSchema)
    .mutation(({ ctx, input }) =>
      toggleStaffHomePlanReleaseTask(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input,
      ),
    ),

  toggleProviderHomePlanReleaseTask: providerProcedure
    .input(toggleReleaseTaskSchema)
    .mutation(({ ctx, input }) =>
      toggleProviderHomePlanReleaseTask(
        ctx.prisma,
        {
          activeProviderId: ctx.providerId,
          providerPseudonymizedId: ctx.providerPseudonymizedId,
        },
        input,
      ),
    ),

  updateHomePlanReleaseTaskDetail: staffProcedure
    .input(updateReleaseTaskDetailSchema)
    .mutation(({ ctx, input }) =>
      updateStaffHomePlanReleaseTaskDetail(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input,
      ),
    ),

  updateProviderHomePlanReleaseTaskDetail: providerProcedure
    .input(updateReleaseTaskDetailSchema)
    .mutation(({ ctx, input }) =>
      updateProviderHomePlanReleaseTaskDetail(
        ctx.prisma,
        {
          activeProviderId: ctx.providerId,
          providerPseudonymizedId: ctx.providerPseudonymizedId,
        },
        input,
      ),
    ),
});
