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

import { setActiveHousingProvider } from "~@idaho-th/trpc/auth/resolveActiveHousingProvider";
import { providerProcedureBase, router } from "~@idaho-th/trpc/init";
import { setActiveHousingProviderSchema } from "~@idaho-th/trpc/routes/housingProvider/housingProvider.schema";
import { resolveHousingProviders } from "~@idaho-th/trpc/routes/housingProvider/housingProvider.service";

/**
 * The two endpoints a provider can call before they are acting as any
 * organization, and the only ones built on `providerProcedureBase` —
 * everything else in the portal needs a verified organization and would
 * deadlock the selection screen if it ran before one existed.
 */
export const housingProviderRouter = router({
  resolve: providerProcedureBase.query(({ ctx }) =>
    resolveHousingProviders(ctx.prisma, ctx.providerUserId),
  ),

  setActive: providerProcedureBase
    .input(setActiveHousingProviderSchema)
    .mutation(({ ctx, input }) =>
      setActiveHousingProvider(
        ctx.prisma,
        ctx.providerUserId,
        input.providerId,
      ),
    ),
});
