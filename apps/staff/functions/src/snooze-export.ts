// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { add, isBefore, parseISO, startOfToday } from "date-fns";
import * as admin from "firebase-admin";
import { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

import { FirestoreExporter } from "./FirestoreExporter";
import { formatDate } from "./utils";

type SnoozeState = {
  state_code: string;
  person_external_id: string;
  opportunity_type: string;
  snoozed_by: string;
  snooze_start_date: string;
  snooze_end_date?: string;
  denial_reasons: string[];
  other_reason?: string;
  as_of: string;
};

class SnoozeExporter extends FirestoreExporter<SnoozeState> {
  outputBucketEnvVar = "SNOOZE_OUTPUT_BUCKET";

  docsQuery(db: Firestore) {
    return db
      .collectionGroup("clientOpportunityUpdates")
      .where("denial", "!=", null);
  }

  firestoreDocToExportData(doc: QueryDocumentSnapshot) {
    // Path is of the form "clientUpdatesV2/client_id/clientOpportunityUpdates/usXxOpportunityType"
    const [, client_id, , opportunity_type] = doc.ref.path.split("/");
    const [country, state, person_external_id] = client_id.split("_");
    const state_code = `${country}_${state}`.toUpperCase();

    const { denial, manualSnooze, autoSnooze } = doc.data();

    if (!denial) return; // We searched for it, but double-check

    if (denial.reasons.length === 0) return; // No reasons means the denial isn't active anymore

    const snooze_start_date = denial.updated.date.toDate();

    const snoozeState: SnoozeState = {
      state_code,
      person_external_id,
      opportunity_type,
      snoozed_by: denial.updated.by,
      snooze_start_date: formatDate(snooze_start_date),
      denial_reasons: denial.reasons,
      other_reason: denial.otherReason,
      as_of: formatDate(startOfToday()),
    };

    if (manualSnooze) {
      snoozeState.snooze_end_date = formatDate(
        add(snooze_start_date, { days: manualSnooze.snoozeForDays }),
      );
    } else if (autoSnooze) {
      snoozeState.snooze_end_date = autoSnooze.snoozeUntil;
    }

    if (
      snoozeState.snooze_end_date &&
      isBefore(parseISO(snoozeState.snooze_end_date), startOfToday())
    ) {
      return; // Drop snoozes that have ended
    }

    return snoozeState;
  }
}

const exporter = new SnoozeExporter();
exports.exportSnoozeStates = exporter.createScheduledFunction();
