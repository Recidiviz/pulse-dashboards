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

import { parseISO } from "date-fns";
import fs from "fs";

import { deleteCollection, getDb } from "./firestoreUtils";

const COLLECTIONS = {
  clients: "clients",
  staff: "staff",
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
    const { compliantReportingEligible } = record;

    if (compliantReportingEligible) {
      compliantReportingEligible.lastDrugNegative = compliantReportingEligible.lastDrugNegative.map(
        parseISO
      );
    }

    bulkWriter.create(db.collection(COLLECTIONS.clients).doc(), {
      ...record,
      supervisionLevelStart: parseISO(record.supervisionLevelStart),
      expirationDate: parseISO(record.expirationDate),
      lastPaymentDate:
        record.lastPaymentDate && parseISO(record.lastPaymentDate),
      nextSpecialConditionsCheck:
        record.nextSpecialConditionsCheck &&
        parseISO(record.nextSpecialConditionsCheck),
      compliantReportingEligible,
    });
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

loadUserFixture();
loadClientsFixture();
