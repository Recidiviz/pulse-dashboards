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

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_PUBLIC_PATHWAYS_API_URL_BASE: string;
  readonly VITE_PUBLIC_PATHWAYS_AUTH0_DOMAIN: string;
  readonly VITE_PUBLIC_PATHWAYS_AUTH0_CLIENT_ID: string;
  readonly VITE_PUBLIC_PATHWAYS_AUTH_ENV: string;
  readonly VITE_PUBLIC_PATHWAYS_AUTH0_AUDIENCE: string;
  readonly VITE_PUBLIC_PATHWAYS_FIRESTORE_API_KEY: string;
  readonly VITE_PUBLIC_PATHWAYS_FIRESTORE_PROJECT: string;
  readonly VITE_PUBLIC_PATHWAYS_SENTRY_DSN: string;
  readonly VITE_PUBLIC_PATHWAYS_SENTRY_ENV: string;
  readonly VITE_PUBLIC_PATHWAYS_METADATA_NAMESPACE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}