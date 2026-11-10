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
import { getFirestore } from "firebase-admin/firestore";

import {
  AuthorizedUserProfile,
  Permission,
  ResidentUserProfile,
} from "~@jii/auth";
import { StateCode } from "~@jii/configs";
import { getPrismaClient } from "~@jii/prisma";

import { isUserFlagActive } from "../helpers/featureFlags";
import { firebaseApp } from "../helpers/firebaseAdmin";

// signer creation is function-scoped rather than module-scoped
// so that an error with the key doesn't bring down the entire app
function signIntercomJwt(payload: SignerPayload) {
  return createSigner({
    key: process.env["INTERCOM_WEB_SDK_SECRET_KEY"],
  })(payload);
}

export type RosterLookupOpts = {
  stateCode: StateCode;
  userExternalId: string;
  userIdFromAuthProvider: string;
};
async function lookupResident({
  stateCode,
  userExternalId,
  userIdFromAuthProvider,
  demo,
}: RosterLookupOpts & {
  demo: boolean;
}): Promise<ResidentUserProfile | undefined> {
  const prisma = getPrismaClient({ stateCode, demo });
  const userRecord = await prisma.resident.findFirst({
    where: {
      tabletUserId: userExternalId,
    },
    select: { pseudonymizedId: true, personExternalId: true },
  });
  if (!userRecord) return;
  const { personExternalId, pseudonymizedId } = userRecord;

  // if we've gotten this far, it means we have a match and we know this user is a (demo) resident.
  // only live residents get live data; constructing permissions now so the flag check can consume them
  const userPermissions: Array<Permission> = demo ? [] : ["live_data"];

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

export async function checkResidentsRoster(
  opts: RosterLookupOpts,
): Promise<AuthorizedUserProfile | undefined> {
  return lookupResident({ ...opts, demo: false });
}

export async function checkDemoResidentsRoster(
  opts: RosterLookupOpts,
): Promise<ResidentUserProfile | undefined> {
  return lookupResident({ ...opts, demo: true });
}

export async function checkEdovoTestAccountRoster(userId: string) {
  return (
    await getFirestore(firebaseApp())
      .doc(`JII-edovoToRecidivizMappings/${userId}`)
      .get()
  ).data();
}
