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

import { resolveRequiredEnv } from "~@idaho-th/trpc/routes/common/env";
import { serverConfig } from "~@idaho-th/trpc/routes/common/serverConfig";
import {
  VERTEX_AI_LOCAL_REQUIRED_ENV_KEYS,
  VERTEX_AI_REQUIRED_ENV_KEYS,
} from "~@idaho-th/trpc/routes/vertex/constants";
import { VertexAIConfig } from "~@idaho-th/trpc/routes/vertex/vertex.types";

const env = resolveRequiredEnv(
  serverConfig.isProduction
    ? VERTEX_AI_REQUIRED_ENV_KEYS
    : VERTEX_AI_LOCAL_REQUIRED_ENV_KEYS,
  {
    label: "Vertex AI",
  },
);

export const vertexAIConfig: VertexAIConfig = {
  project: env.GOOGLE_PROJECT_ID,
};
