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
  dismissAlertSchema,
  getApplicationByIdSchema,
} from "~@idaho-th/trpc/routes/applicationDetail/applicationDetail.schema";
import {
  dismissProviderAlert,
  dismissStaffAlert,
  getProviderApplicationById,
  getStaffApplicationById,
} from "~@idaho-th/trpc/routes/applicationDetail/applicationDetail.service";

export const applicationDetailRouter = router({
  getStaffApplicationById: staffProcedure
    .input(getApplicationByIdSchema)
    .query(({ ctx, input }) =>
      getStaffApplicationById(
        ctx.prisma,
        ctx.staffPseudonymizedId,
        input.applicationId,
      ),
    ),

  getProviderApplicationById: providerProcedure
    .input(getApplicationByIdSchema)
    .query(({ ctx, input }) =>
      getProviderApplicationById(
        ctx.prisma,
        ctx.providerId,
        input.applicationId,
      ),
    ),

  dismissProviderAlert: providerProcedure
    .input(dismissAlertSchema)
    .mutation(({ ctx, input }) =>
      dismissProviderAlert(
        ctx.prisma,
        ctx.providerId,
        ctx.providerPseudonymizedId,
        input.alertId,
      ),
    ),

  dismissStaffAlert: staffProcedure
    .input(dismissAlertSchema)
    .mutation(({ ctx, input }) =>
      dismissStaffAlert(ctx.prisma, ctx.staffPseudonymizedId, input.alertId),
    ),
});
