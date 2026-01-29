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

import { init, prismaIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

init({
  // same project as jii-functions, we expect this will eventually replace that
  dsn: "https://9854b2227e71fa6bd5191e28c0e14320@o432474.ingest.us.sentry.io/4509159316979712",
  environment: process.env["DEPLOY_ENV"],
  tracesSampleRate: 0,
  profilesSampleRate: 0,
  integrations: [nodeProfilingIntegration(), prismaIntegration()],
  maxValueLength: 5000,
});
