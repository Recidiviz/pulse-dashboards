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

/* eslint-disable no-console */

import { Firestore } from "@google-cloud/firestore";
import { add } from "date-fns";

import { OpportunityType } from "~datatypes";

import { PartialRecord } from "../src/utils/typeUtils";

const { FIREBASE_PROJECT, FIREBASE_CREDENTIAL } = process.env;
console.log({ FIREBASE_PROJECT, FIREBASE_CREDENTIAL });

function getDb() {
  const fsSettings: FirebaseFirestore.Settings = FIREBASE_CREDENTIAL
    ? {
        projectId: FIREBASE_PROJECT,
        keyFilename: FIREBASE_CREDENTIAL,
      }
    : {
        projectId: "demo-dev",
        host: "localhost:8080",
        credentials: {},
        ssl: false,
        keyFilename: "",
        ignoreUndefinedProperties: true,
      };

  return new Firestore(fsSettings);
}

const snoozePeriodByOpp: PartialRecord<OpportunityType, number> = {
  pastFTRD: 30,
  usTnExpiration: 30,

  LSU: 90,
  earnedDischarge: 90,
  usIdSupervisionLevelDowngrade: 90,
  compliantReporting: 90,
  supervisionLevelDowngrade: 90,
  usTnCustodyLevelDowngrade: 90,
  usTnAnnualReclassification: 90,

  usMeSCCP: 180,
  usMeEarlyTermination: 180,
  usMeWorkRelease: 180,
  usMeFurloughRelease: 180,
};

const db = getDb();

const missingOpps: PartialRecord<OpportunityType, number> = {};

async function updateSnooze() {
  const denialDocs = await db
    .collectionGroup("clientOpportunityUpdates")
    .where("denial", "!=", null)
    .get();

  // Yes, this could be async, but we are running it once and this creates a natural rate limit
  for (const docSnapshot of denialDocs.docs) {
    const doc = docSnapshot.data();

    // skip docs with snooze set or no denial reasons
    // we need to do these checks manually since Firestore only allows one "not" clause
    if (
      doc.autoSnooze ||
      doc.manualSnooze ||
      doc.denial?.reasons?.length === 0
    ) {
      continue;
    }

    const { path } = docSnapshot.ref;

    // Path is of the form "clientUpdatesV2/client_id/clientOpportunityUpdates/usXxOpportunityType"
    // So splitting by "/" and taking the last element gives the opportunity type
    const opportunityType = path.split("/").slice(-1)[0] as OpportunityType;

    const snoozeDays = snoozePeriodByOpp[opportunityType];

    if (snoozeDays === undefined) {
      console.log("No snooze configured for doc:", path);
      if (missingOpps[opportunityType] !== undefined) {
        // @ts-ignore

        missingOpps[opportunityType]++;
      } else {
        missingOpps[opportunityType] = 1;
      }
      continue;
    }

    const deniedOn = doc.denial?.updated.date
      ? doc.denial.updated.date.toDate()
      : undefined;

    const snoozeUntilDate = deniedOn
      ? add(deniedOn, { days: snoozeDays })
      : new Date();

    const update = {
      autoSnooze: {
        snoozedBy: "auto-snooze", // TODO: confirm this
        snoozedOn: new Date().toISOString().split("T")[0],
        snoozeUntil: snoozeUntilDate.toISOString().split("T")[0],
      },
    };

    try {
      // eslint-disable-next-line no-await-in-loop
      await docSnapshot.ref.update(update);
    } catch (e) {
      console.log("Error updating", path);
      console.log(e);
    }
  }

  console.log(missingOpps);
}

updateSnooze();
