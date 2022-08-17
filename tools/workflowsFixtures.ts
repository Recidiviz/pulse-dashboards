/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import fs from "fs";

import { deleteCollection, getDb } from "./firestoreUtils";

const COLLECTIONS = {
  clients: "clients",
  staff: "staff",
  compliantReportingReferrals: "compliantReportingReferrals",
  earlyTerminationReferrals: "earlyTerminationReferrals",
};

const db = getDb();

async function loadClientsFixture() {
  console.log("wiping existing client data ...");
  await deleteCollection(db, COLLECTIONS.clients);

  console.log("loading new client data...");
  const bulkWriter = db.bulkWriter();

  const rawCases = JSON.parse(
    fs.readFileSync("tools/fixtures/clients.json").toString()
  );

  // Iterate through each record
  rawCases.forEach((record: Record<string, any>) => {
    bulkWriter.create(
      db.doc(
        `${COLLECTIONS.clients}/${record.stateCode}_${record.personExternalId}`
      ),
      record
    );
  });

  bulkWriter
    .close()
    .then(() => console.log("new client data loaded successfully"));
}

async function loadUserFixture() {
  console.log("wiping existing staff data ...");
  await deleteCollection(db, COLLECTIONS.staff);

  console.log("loading new staff data...");
  const bulkWriter = db.bulkWriter();

  const rawUsers = JSON.parse(
    fs.readFileSync("tools/fixtures/users.json").toString()
  );

  rawUsers.forEach((rawUser: any) => {
    bulkWriter.create(db.collection(COLLECTIONS.staff).doc(), rawUser);
  });

  await bulkWriter.flush();
  await bulkWriter.close();

  console.log("new staff data loaded successfully");
}

async function loadCompliantReportingReferralsFixture() {
  console.log("wiping existing referral data ...");
  await deleteCollection(db, COLLECTIONS.compliantReportingReferrals);

  console.log("loading new referral data...");
  const bulkWriter = db.bulkWriter();

  const rawUsers = JSON.parse(
    fs
      .readFileSync("tools/fixtures/compliantReportingReferrals.json")
      .toString()
  );

  rawUsers.forEach((rawReferral: any) => {
    bulkWriter.create(
      db.doc(
        `${COLLECTIONS.compliantReportingReferrals}/${rawReferral.tdocId}`
      ),
      rawReferral
    );
  });

  await bulkWriter.flush();
  await bulkWriter.close();

  console.log("new compliant reporting referral data loaded successfully");
}

async function loadEarlyTerminationReferralsFixture() {
  console.log("wiping existing referral data ...");
  await deleteCollection(db, COLLECTIONS.earlyTerminationReferrals);

  console.log("loading new referral data...");
  const bulkWriter = db.bulkWriter();

  const rawUsers = JSON.parse(
    fs.readFileSync("tools/fixtures/earlyTerminationReferrals.json").toString()
  );

  rawUsers.forEach((rawReferral: any) => {
    bulkWriter.create(
      db.doc(
        `${COLLECTIONS.earlyTerminationReferrals}/${rawReferral.externalId}`
      ),
      rawReferral
    );
  });

  await bulkWriter.flush();
  await bulkWriter.close();

  console.log("new early termination referral data loaded successfully");
}

loadUserFixture();
loadClientsFixture();
loadCompliantReportingReferralsFixture();
loadEarlyTerminationReferralsFixture();
