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

// Emits the canonical collection→fields mapping as a single JSON array on
// stdout. Consumed by atmos stack files via the `!exec` YAML tag so the same
// schema definitions drive both:
//   - the Typesense collection schemas (via provision.ts and inspect.ts)
//   - the Firebase extension's FIRESTORE_COLLECTION_FIELDS_LIST and
//     FIRESTORE_COLLECTION_PATHS params (via apps/firestore-typesense-search)
//   - the typesense-backfill Cloud Function's COLLECTIONS_JSON env var
//
// Output is pure JSON with no decoration — any noise breaks the YAML parse on
// the atmos side. Stderr is unused.

import { schemas } from "./schemas";

const collections = schemas.map((s) => ({
  name: s.name,
  fields: (s.fields ?? []).map((f) => f.name),
}));

process.stdout.write(JSON.stringify(collections));
