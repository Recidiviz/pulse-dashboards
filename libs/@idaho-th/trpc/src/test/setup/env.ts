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

// Placeholders for the env vars that are read at *module load* — importing
// appRouter pulls in routes/vertex/config.ts and the GCS storage client, both
// of which throw on a missing key before a single test runs. The values only
// need to be present, never valid: no test makes a real Vertex or GCS call.
//
// Config read lazily (e.g. getPlacesConfig) does not belong here — those keys
// are the business of the test that exercises them.
//
// Assigned with `??=` so a real value from .env.test, CI, or the shell always
// wins. This is a setup file (see vite.config.mts), so it runs before any test
// module — and therefore before any `vi.hoisted` block — is imported.
const TEST_ENV_DEFAULTS: Record<string, string> = {
  GOOGLE_PROJECT_ID: "test-project",
  GOOGLE_APPLICATION_CREDENTIALS: "test-google-application-credentials.json",
  IDAHO_TH_PDF_GCS_BUCKET: "test-pdf-bucket",
};

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[key] ??= value;
}
