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

import firebaseAdmin from "firebase-admin";

import env from "~@meetings/trpc/env";

export const firebaseApp = () => {
  // These should always be present with the exception of the contractor env file (we
  // don't expect contractors to be working in this area at this time).
  const { FIREBASE_BACKEND_PROJECT, FIREBASE_ADMIN_SERVICE_ACCOUNT_EMAIL } =
    env;
  if (!FIREBASE_BACKEND_PROJECT || !FIREBASE_ADMIN_SERVICE_ACCOUNT_EMAIL) {
    throw new Error(
      "FIREBASE_BACKEND_PROJECT and FIREBASE_ADMIN_SERVICE_ACCOUNT_EMAIL are required to initialize firebase app",
    );
  }
  return (
    firebaseAdmin.apps[0] ??
    firebaseAdmin.initializeApp({
      projectId: FIREBASE_BACKEND_PROJECT,
      credential: firebaseAdmin.credential.applicationDefault(),
      serviceAccountId: FIREBASE_ADMIN_SERVICE_ACCOUNT_EMAIL,
    })
  );
};
