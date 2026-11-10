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

import type { createContext } from "~@idaho-th/trpc/context";
import { router, staffProcedure } from "~@idaho-th/trpc/init";
import { assertWithinPlacesRateLimit } from "~@idaho-th/trpc/routes/places/places.rateLimit";
import {
  autocompleteInputSchema,
  placeDetailsInputSchema,
} from "~@idaho-th/trpc/routes/places/places.schema";
import {
  autocompleteAddressesService,
  getPlaceDetailsService,
} from "~@idaho-th/trpc/routes/places/places.service";
import type { PlacesProcedureMeta } from "~@idaho-th/trpc/routes/places/places.types";

type StaffContext = Awaited<ReturnType<typeof createContext>> & {
  staffPseudonymizedId: string;
};

function buildPlacesProcedureMeta(
  ctx: StaffContext,
  procedureName: string,
): PlacesProcedureMeta {
  const { staffPseudonymizedId } = ctx;

  assertWithinPlacesRateLimit(staffPseudonymizedId);

  return {
    traceId: String(ctx.req.id ?? "unknown"),
    procedureName,
    staffPseudonymizedId,
  };
}

export const placesRouter = router({
  autocompleteAddresses: staffProcedure
    .input(autocompleteInputSchema)
    .query(async ({ input, ctx }) =>
      autocompleteAddressesService(
        input,
        buildPlacesProcedureMeta(ctx, "places.autocompleteAddresses"),
      ),
    ),

  getPlaceDetails: staffProcedure
    .input(placeDetailsInputSchema)
    .query(async ({ input, ctx }) =>
      getPlaceDetailsService(
        input,
        buildPlacesProcedureMeta(ctx, "places.getPlaceDetails"),
      ),
    ),
});
