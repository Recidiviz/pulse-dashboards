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

import {
  createLabelStudioClient,
  type LabelStudioClient,
} from "~@meetings/tasks/label-studio-client";
import env from "~@meetings/trpc/env";

export interface LabelStudioConfig {
  client: LabelStudioClient;
  /** Where Label Studio is served, for building links to its UI. */
  baseUrl: string;
  projectId: number;
}

/**
 * The configured Label Studio client, or null when this environment has no
 * Label Studio to talk to (local dev, CI).
 *
 * A *partial* configuration is a deployment mistake, not a degraded mode, so
 * it throws rather than quietly behaving as if Label Studio didn't exist.
 */
export function labelStudioConfig(): LabelStudioConfig | null {
  const values = {
    baseUrl: env.LABEL_STUDIO_URL,
    refreshToken: env.LABEL_STUDIO_API_TOKEN,
    iapAudience: env.LABEL_STUDIO_IAP_AUDIENCE,
    projectId: env.LABEL_STUDIO_PROJECT_ID,
  };

  const present = Object.entries(values).filter(([, v]) => v !== undefined);
  if (present.length === 0) return null;
  if (present.length < Object.keys(values).length) {
    const missing = Object.entries(values)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k);
    throw new Error(
      `Label Studio is partially configured; missing: ${missing.join(", ")}`,
    );
  }

  return {
    baseUrl: values.baseUrl as string,
    client: createLabelStudioClient({
      baseUrl: values.baseUrl as string,
      refreshToken: values.refreshToken as string,
      iapAudience: values.iapAudience as string,
      keyFile: env.SA_KEY_FILE,
    }),
    projectId: values.projectId as number,
  };
}
