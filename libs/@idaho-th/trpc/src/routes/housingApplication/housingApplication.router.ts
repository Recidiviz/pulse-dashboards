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

import { mergeRouters } from "~@idaho-th/trpc/init";
import { applicationDetailRouter } from "~@idaho-th/trpc/routes/applicationDetail/applicationDetail.router";
import { applicationProvidersRouter } from "~@idaho-th/trpc/routes/applicationProviders/applicationProviders.router";
import { draftIntakeRouter } from "~@idaho-th/trpc/routes/draftIntake/draftIntake.router";
import { homePlanRouter } from "~@idaho-th/trpc/routes/homePlan/homePlan.router";
import { infoRequestRouter } from "~@idaho-th/trpc/routes/infoRequest/infoRequest.router";
import { listingApplicationRouter } from "~@idaho-th/trpc/routes/listingApplication/listingApplication.router";
import { providerMatchingRouter } from "~@idaho-th/trpc/routes/providerMatching/providerMatching.router";
import { providerPortalRouter } from "~@idaho-th/trpc/routes/providerPortal/providerPortal.router";
import { providerResponseRouter } from "~@idaho-th/trpc/routes/providerResponse/providerResponse.router";
import { staffApplicationRouter } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.router";

/**
 * Composed housing application API. Domain routers live as siblings under
 * `routes/`; this merge preserves the flat `trpc.housingApplication.*` client API.
 *
 * IMP: If we want to make it separate top-level routes then we need to change client side as well.
 */

export const housingApplicationRouter = mergeRouters(
  listingApplicationRouter,
  applicationDetailRouter,
  draftIntakeRouter,
  staffApplicationRouter,
  providerMatchingRouter,
  applicationProvidersRouter,
  providerPortalRouter,
  providerResponseRouter,
  infoRequestRouter,
  homePlanRouter,
);
