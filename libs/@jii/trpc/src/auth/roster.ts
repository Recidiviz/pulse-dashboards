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

import { DocumentData, getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

import { AuthorizedUserProfile, ResidentUserProfile } from "~@jii/auth";

import { firebaseApp } from "../helpers/firebaseAdmin";

// we aren't reusing the querier function from firebaseAdmin helpers here
// because this feature is not subject to the same restrictions as user data endpoints
const firestore = () => getFirestore(firebaseApp());

function getResidentIds(residentRecord: DocumentData) {
  // in practice this should always parse, but we can't import the full schema from ~datatypes
  // due to Vite dependency issues. We only care about these fields anyway
  return z
    .object({ personExternalId: z.string(), pseudonymizedId: z.string() })
    .parse(residentRecord);
}

async function getResidentRecordForDisplayId(
  stateCode: string,
  displayId: string,
): Promise<DocumentData | undefined> {
  const userResidentRecord = (
    await firestore()
      .collection(`residents`)
      .where("stateCode", "==", stateCode)
      .where("displayId", "==", displayId)
      .limit(1)
      .get()
  ).docs[0]?.data();

  return userResidentRecord;
}

export async function checkResidentsRoster(
  stateCode: string,
  userId: string,
): Promise<AuthorizedUserProfile | undefined> {
  let userResidentRecord;
  if (["US_AR", "US_AZ", "US_CO", "US_NE"].includes(stateCode)) {
    userResidentRecord = await getResidentRecordForDisplayId(stateCode, userId);
  } else {
    userResidentRecord = (
      await firestore()
        .doc(`residents/${stateCode.toLowerCase()}_${userId.toLowerCase()}`)
        .get()
    ).data();
  }

  if (!userResidentRecord) return;

  const { pseudonymizedId, personExternalId } =
    getResidentIds(userResidentRecord);

  return {
    stateCode: stateCode,
    externalId: personExternalId,
    pseudonymizedId,
    permissions: ["live_data"],
  };
}

export async function checkDemoResidentsRoster(
  stateCode: string,
  userId: string,
): Promise<ResidentUserProfile | undefined> {
  const userDemoResidentRecord = (
    await firestore()
      .collection(`DEMO_residents`)
      .where("stateCode", "==", stateCode)
      .where("personExternalId", "==", userId)
      .limit(1)
      .get()
  ).docs[0]?.data();

  if (!userDemoResidentRecord) return;

  const { pseudonymizedId } = getResidentIds(userDemoResidentRecord);

  return {
    stateCode: stateCode,
    externalId: userId,
    pseudonymizedId,
    permissions: [],
  };
}

export async function checkEdovoTestAccountRoster(userId: string) {
  return (
    await firestore().doc(`JII-edovoToRecidivizMappings/${userId}`).get()
  ).data();
}
