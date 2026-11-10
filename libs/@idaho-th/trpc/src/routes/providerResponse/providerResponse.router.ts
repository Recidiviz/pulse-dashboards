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
import { submitProviderResponseSchema } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.schema";
import { submitProviderApplicationResponse } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.service";

export const providerResponseRouter = router({
  submitProviderResponse: providerProcedure
    .input(submitProviderResponseSchema)
    .mutation(({ ctx, input }) => {
      const message = "message" in input ? input.message : undefined;

      return submitProviderApplicationResponse(
        ctx.prisma,
        {
          providerId: ctx.providerId,
          providerPseudonymizedId: ctx.providerPseudonymizedId,
        },
        input.applicationId,
        input.response,
        message,
      );
    }),
});
