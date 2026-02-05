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

import { isOfflineMode } from "~client-env-utils";

export function getFirestoreProjectId() {
  const projectId = import.meta.env.VITE_FIREBASE_BACKEND_PROJECT;
  const testEnv = import.meta.env.VITE_TEST_ENV;
  // Avoid connection attempts to firestore emulator in tests
  if (testEnv) return "test";

  // offline mode connects to firestore emulator.
  // also fall back to this if the config is missing for some reason
  // (not expected in practice but technically possible)
  if (isOfflineMode() || !projectId) {
    // demo-* is the Firebase magic word for a dummy project
    return "demo-dev";
  }

  // in practice this should always be a string by now anyway, this makes it typesafe
  return `${projectId}`;
}
