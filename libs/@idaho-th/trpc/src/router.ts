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

import { router } from "~@idaho-th/trpc/init";
import { aiExtractionMetricsRouter } from "~@idaho-th/trpc/routes/aiExtractionMetrics/aiExtractionMetrics.router";
import { authRouter } from "~@idaho-th/trpc/routes/auth/auth.route";
import { documentsRouter } from "~@idaho-th/trpc/routes/documents";
import { housingApplicationRouter } from "~@idaho-th/trpc/routes/housingApplication/housingApplication.router";
import { housingProviderRouter } from "~@idaho-th/trpc/routes/housingProvider";
import { intercomRouter } from "~@idaho-th/trpc/routes/intercom";
import { placesRouter } from "~@idaho-th/trpc/routes/places/places.route";
import { timelineRouter } from "~@idaho-th/trpc/routes/timeline";
import { vertexRouter } from "~@idaho-th/trpc/routes/vertex/vertex.route";
import { vertexUploadRouter } from "~@idaho-th/trpc/routes/vertexUpload/vertexUpload.router";

/**
 * Main tRPC router for Idaho Transitional Housing.
 *
 * Contractors: Add your route modules here following this pattern:
 *
 * import { myFeatureRouter } from "~@idaho-th/trpc/routes/my-feature/my-feature.router";
 *
 * export const appRouter = router({
 *   myFeature: myFeatureRouter,
 * });
 */
export const appRouter = router({
  aiExtractionMetrics: aiExtractionMetricsRouter,
  auth: authRouter,
  documents: documentsRouter,
  housingApplication: housingApplicationRouter,
  intercom: intercomRouter,
  places: placesRouter,
  housingProvider: housingProviderRouter,
  timeline: timelineRouter,
  vertex: vertexRouter,
  vertexUpload: vertexUploadRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
