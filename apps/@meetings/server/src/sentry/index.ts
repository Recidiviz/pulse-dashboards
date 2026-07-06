// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import type { SamplingContext } from "@sentry/core";
import { init, prismaIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const PIPELINE_ROUTES = [
  "/stitch-audio",
  "/transcribe-audio",
  "/process-notetaking",
  "/run-llmaj-evaluation",
];

function requestMatchesRoute(ctx: SamplingContext, routes: string[]) {
  const httpRoute = ctx.attributes?.["http.route"];
  const urlPath = ctx.attributes?.["url.path"];
  const haystacks = [
    ctx.name,
    typeof httpRoute === "string" ? httpRoute : undefined,
    typeof urlPath === "string" ? urlPath : undefined,
    ctx.normalizedRequest?.url,
  ].filter((s): s is string => typeof s === "string");

  return routes.some((route) => haystacks.some((h) => h.includes(route)));
}

init({
  dsn: process.env["SENTRY_DSN"],
  environment: process.env["SENTRY_ENV"],
  tracesSampler: (ctx) => {
    if (requestMatchesRoute(ctx, PIPELINE_ROUTES)) return 1;
    return ctx.parentSampled ?? 0;
  },
  profilesSampleRate: 0,
  integrations: [nodeProfilingIntegration(), prismaIntegration()],
  maxValueLength: 5000,
});
