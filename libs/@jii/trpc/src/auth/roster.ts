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

import { createSigner, SignerPayload } from "fast-jwt";
import { DocumentData, getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

import {
  AuthorizedUserProfile,
  Permission,
  ResidentUserProfile,
} from "~@jii/auth";
import { StateCode } from "~@jii/configs";
import { getPrismaClient } from "~@jii/prisma";

import { isUserFlagActive } from "../helpers/featureFlags";
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

// signer creation is function-scoped rather than module-scoped
// so that an error with the key doesn't bring down the entire app
function signIntercomJwt(payload: SignerPayload) {
  return createSigner({
    key: process.env["INTERCOM_WEB_SDK_SECRET_KEY"],
  })(payload);
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

export type RosterLookupOpts = {
  stateCode: StateCode;
  userExternalId: string;
  userIdFromAuthProvider: string;
};
export async function checkResidentsRoster({
  stateCode,
  userExternalId,
  userIdFromAuthProvider,
}: RosterLookupOpts): Promise<AuthorizedUserProfile | undefined> {
  const lookupByDisplayId = ["US_AR", "US_AZ", "US_CO", "US_NE"].includes(
    stateCode,
  );
  let personExternalId: string;
  let pseudonymizedId: string;

  const prisma = getPrismaClient({ stateCode, demo: false });
  if (
    await isUserFlagActive({
      stateCode,
      prisma,
      userIdFromAuthProvider,
      flagId: "useNewResidentData",
      // we don't know the user's permissions yet, that depends on the roster checks
      userPermissions: undefined,
    })
  ) {
    const userRecord = await prisma.resident.findFirst({
      where: {
        displayId: lookupByDisplayId ? userExternalId : undefined,
        personExternalId: lookupByDisplayId ? undefined : userExternalId,
      },
      select: { pseudonymizedId: true, personExternalId: true },
    });
    if (!userRecord) return;
    ({ personExternalId, pseudonymizedId } = userRecord);
  } else {
    let userResidentRecord;
    if (lookupByDisplayId) {
      userResidentRecord = await getResidentRecordForDisplayId(
        stateCode,
        userExternalId,
      );
    } else {
      userResidentRecord = (
        await firestore()
          .doc(
            `residents/${stateCode.toLowerCase()}_${userExternalId.toLowerCase()}`,
          )
          .get()
      ).data();
    }

    if (!userResidentRecord) return;

    ({ pseudonymizedId, personExternalId } =
      getResidentIds(userResidentRecord));
  }

  // if we've gotten this far, it means we have a match and we know this user is a resident.
  // these are the applicable permissions for residents; constructing them now so the flag check can consume them
  const userPermissions: Array<Permission> = ["live_data"];

  let intercomToken: string | undefined;
  if (
    await isUserFlagActive({
      stateCode,
      prisma,
      userIdFromAuthProvider,
      flagId: "intercom",
      userPermissions,
    })
  ) {
    intercomToken = signIntercomJwt({ user_id: pseudonymizedId });
  }

  return {
    stateCode: stateCode,
    externalId: personExternalId,
    pseudonymizedId,
    intercomToken,
    permissions: userPermissions,
  };
}

export async function checkDemoResidentsRoster({
  stateCode,
  userExternalId,
  userIdFromAuthProvider,
}: RosterLookupOpts): Promise<ResidentUserProfile | undefined> {
  let pseudonymizedId: string;
  const prisma = getPrismaClient({ stateCode, demo: true });
  if (
    await isUserFlagActive({
      stateCode,
      prisma,
      userIdFromAuthProvider,
      flagId: "useNewResidentData",
      // we don't know the user's permissions yet, that depends on the roster checks
      userPermissions: undefined,
    })
  ) {
    const userRecord = await prisma.resident.findFirst({
      where: {
        personExternalId: userExternalId,
      },
      select: { pseudonymizedId: true },
    });
    if (!userRecord) return;
    ({ pseudonymizedId } = userRecord);
  } else {
    const userDemoResidentRecord = (
      await firestore()
        .collection(`DEMO_residents`)
        .where("stateCode", "==", stateCode)
        .where("personExternalId", "==", userExternalId)
        .limit(1)
        .get()
    ).docs[0]?.data();

    if (!userDemoResidentRecord) return;

    ({ pseudonymizedId } = getResidentIds(userDemoResidentRecord));
  }

  // if we've gotten this far, it means we have a match and we know this user is a demo resident.
  // these are the applicable permissions for demo residents; constructing them now so the flag check can consume them
  const userPermissions: Array<Permission> = [];

  let intercomToken: string | undefined;
  if (
    await isUserFlagActive({
      stateCode,
      prisma,
      userIdFromAuthProvider,
      flagId: "intercom",
      userPermissions,
    })
  ) {
    intercomToken = signIntercomJwt({ user_id: pseudonymizedId });
  }

  return {
    stateCode: stateCode,
    externalId: userExternalId,
    pseudonymizedId,
    intercomToken,
    permissions: userPermissions,
  };
}

export async function checkEdovoTestAccountRoster(userId: string) {
  return (
    await firestore().doc(`JII-edovoToRecidivizMappings/${userId}`).get()
  ).data();
}
