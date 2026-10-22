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
  strictImportMetaEnv: true;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTH_ENV: string;
  readonly VITE_CASE_NOTES_API_URL: string;
  readonly VITE_CRYPTO_PASSPHRASE: string;
  readonly VITE_DEPLOY_ENV: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_BACKEND_PROJECT: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_INTERCOM_APP_ID: string;
  readonly VITE_IS_OFFLINE: string;
  readonly VITE_JII_API_URL: string;
  readonly VITE_METADATA_NAMESPACE: string;
  readonly VITE_MODULE_BACKEND_URL: string;
  readonly VITE_NEW_BACKEND_API_URL: string;
  readonly VITE_SENTENCING_API_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENV: string;
  readonly VITE_TEST_ENV: string;
  // add more here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
