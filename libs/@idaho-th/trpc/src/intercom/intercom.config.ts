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

/** All process.env reads for Intercom go through this file. */

import {
  INTERCOM_API_BASE_URL,
  INTERCOM_ENV,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import {
  getOptionalEnv,
  getRequiredEnv,
} from "~@idaho-th/trpc/routes/common/env";

export function getIntercomToken(): string {
  return getRequiredEnv(INTERCOM_ENV.TOKEN);
}

export function getIntercomAdminId(): string {
  return getRequiredEnv(INTERCOM_ENV.ADMIN_ID);
}

export function getIntercomApiBaseUrl(): string {
  return getOptionalEnv(INTERCOM_ENV.API_BASE) ?? INTERCOM_API_BASE_URL;
}

export function getOptionalIntercomTemplateDir(): string | undefined {
  return getOptionalEnv(INTERCOM_ENV.TEMPLATE_DIR);
}

export function isIntercomEnvConfigured(): boolean {
  return Boolean(
    getOptionalEnv(INTERCOM_ENV.TOKEN) && getOptionalEnv(INTERCOM_ENV.ADMIN_ID),
  );
}

export function isIntercomTokenConfigured(): boolean {
  return Boolean(getOptionalEnv(INTERCOM_ENV.TOKEN));
}
