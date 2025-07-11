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

import { isDemoMode } from "~client-env-utils";

import { FIRESTORE_GENERAL_COLLECTION_MAP } from "../constants";
import { FirestoreCollectionKey, FirestoreCollectionKeyConfig } from "../types";

/**
 * Given a Firestore collection specifier and a demo flag,
 * returns the collection name that should be used in Firestore queries
 */
export function collectionNameFromConfig({
  name,
  demo,
}: FirestoreCollectionKeyConfig) {
  let collectionName = name.key
    ? FIRESTORE_GENERAL_COLLECTION_MAP[name.key]
    : name.raw;
  if (demo) collectionName = `DEMO_${collectionName}`;
  return collectionName;
}

/**
 * Given a Firestore collection specifier, returns the collection name that should
 * be used in Firestore queries. In demo environments (identified via environment variable)
 * names will be automatically prefixed to their demo data equivalents.
 */
export function collectionNameForCurrentEnv(
  collectionKey: FirestoreCollectionKey,
) {
  return collectionNameFromConfig({ name: collectionKey, demo: isDemoMode() });
}
