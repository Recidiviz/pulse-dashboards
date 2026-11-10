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

import { providerProcedure, router } from "~@idaho-th/trpc/init";
import {
  updateHousingProviderSchema,
  updateProviderLocationSchema,
  updateProviderProfileSchema,
} from "~@idaho-th/trpc/routes/providerPortal/providerPortal.schema";
import {
  getCurrentProvider,
  getProviderDetails,
  updateHousingProvider,
  updateProviderLocation,
  updateProviderProfile,
} from "~@idaho-th/trpc/routes/providerPortal/providerPortal.service";

export const providerPortalRouter = router({
  getCurrentProvider: providerProcedure.query(({ ctx }) =>
    getCurrentProvider(ctx.prisma, ctx.providerId),
  ),
  getProviderDetails: providerProcedure.query(({ ctx }) =>
    getProviderDetails(ctx.prisma, {
      providerId: ctx.providerId,
      providerUserId: ctx.providerUserId,
    }),
  ),

  // Split by ownership: the organization's own settings, scoped to the active
  // organization, and the caller's personal profile, shared across all of them.
  updateHousingProvider: providerProcedure
    .input(updateHousingProviderSchema)
    .mutation(async ({ ctx, input }) => {
      await updateHousingProvider(ctx.prisma, ctx.providerId, input);

      ctx.req.log.info(
        {
          event: "housing_provider_updated",
          providerId: ctx.providerId,
          providerUserId: ctx.providerUserId,
          changedFields: Object.keys(input),
        },
        "Housing provider settings updated",
      );
    }),

  updateProviderProfile: providerProcedure
    .input(updateProviderProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await updateProviderProfile(ctx.prisma, ctx.providerUserId, input);

      // Names only, never values: a person's name and phone are PII.
      ctx.req.log.info(
        {
          event: "provider_profile_updated",
          providerUserId: ctx.providerUserId,
          changedFields: Object.keys(input),
        },
        "Provider personal details updated",
      );
    }),

  updateProviderLocation: providerProcedure
    .input(updateProviderLocationSchema)
    .mutation(async ({ ctx, input }) => {
      const { locationId, ...editableFields } = input;

      await updateProviderLocation(ctx.prisma, ctx.providerId, input);

      ctx.req.log.info(
        {
          event: "provider_location_updated",
          providerId: ctx.providerId,
          locationId,
          changedFields: Object.keys(editableFields),
        },
        "Provider location updated",
      );
    }),
});
