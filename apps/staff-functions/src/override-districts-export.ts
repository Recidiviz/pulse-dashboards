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

/* Firebase functions in Typescript documentation:
 * https://firebase.google.com/docs/functions/typescript
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

import { FirestoreExporter } from "./FirestoreExporter";

type OverrideDistrictExport = {
  state_code: string;
  person_email: string;
  override_district_ids: string[];
};

class OverrideDistrictExporter extends FirestoreExporter<OverrideDistrictExport> {
  outputBucketEnvVar = "OVERRIDE_DISTRICTS_OUTPUT_BUCKET";

  docsQuery(db: Firestore) {
    return db
      .collection("userUpdates")
      .where("overrideDistrictIds", "!=", null)
      .orderBy("overrideDistrictIds");
  }

  firestoreDocToExportData(docSnapshot: QueryDocumentSnapshot) {
    const [, person_email] = docSnapshot.ref.path.split("/");
    const { stateCode, overrideDistrictIds } = docSnapshot.data();

    const overrideDistrictExport: OverrideDistrictExport = {
      state_code: stateCode,
      person_email,
      override_district_ids: overrideDistrictIds,
    };

    return overrideDistrictExport;
  }
}

const exporter = new OverrideDistrictExporter();
exports.exportDistrictOverrides = exporter.createScheduledFunction();
