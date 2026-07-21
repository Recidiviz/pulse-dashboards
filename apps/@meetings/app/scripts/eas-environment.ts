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

/**
 * Our deploy environments (development/staging/production, matching the EAS `channel`
 * names in eas.json) and EAS's own "Environment" concept (production/preview/development,
 * which controls which EXPO_PUBLIC_* vars get inlined via `--environment`) both go by
 * "environment" but aren't the same thing. This is the single mapping between them, shared
 * by every script that has to pick an `--environment` value for a given deploy env.
 */
export const DEPLOY_ENV_TO_EAS_ENVIRONMENT: Record<string, string> = {
  development: "development",
  staging: "preview",
  production: "production",
};

export function resolveEasEnvironment(deployEnv: string): string {
  const easEnvironment = DEPLOY_ENV_TO_EAS_ENVIRONMENT[deployEnv];
  if (!easEnvironment) {
    throw new Error(
      `Unknown deploy environment "${deployEnv}". Valid values: ${Object.keys(
        DEPLOY_ENV_TO_EAS_ENVIRONMENT,
      ).join(", ")}`,
    );
  }
  return easEnvironment;
}
