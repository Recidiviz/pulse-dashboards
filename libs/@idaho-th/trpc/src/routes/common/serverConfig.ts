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

import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";

export const NODE_ENV = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

export type NodeEnv = (typeof NODE_ENV)[keyof typeof NODE_ENV];

const nodeEnv =
  getOptionalEnv("NODE_ENV", { defaultValue: NODE_ENV.DEVELOPMENT }) ??
  NODE_ENV.DEVELOPMENT;

export const serverConfig = {
  nodeEnv,
  isDevelopment: nodeEnv === NODE_ENV.DEVELOPMENT,
  isProduction: nodeEnv === NODE_ENV.PRODUCTION,
} as const;
