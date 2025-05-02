// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Storage } from "@google-cloud/storage";
import { defineString } from "firebase-functions/params";

import { AuthorizedUserProfile } from "~auth0-jii";

const RECIDIVIZ_ALLOWED_STATES_PROJECT_ID = defineString(
  "RECIDIVIZ_ALLOWED_STATES_PROJECT_ID",
);
const RECIDIVIZ_ALLOWED_STATES_BUCKET_NAME = defineString(
  "RECIDIVIZ_ALLOWED_STATES_BUCKET_NAME",
);

async function getAllowedStates(email: string) {
  const storage = new Storage({
    projectId: RECIDIVIZ_ALLOWED_STATES_PROJECT_ID.value(),
  });

  const recidivizAuthBucketName = RECIDIVIZ_ALLOWED_STATES_BUCKET_NAME.value();
  const jsonFile = (
    await storage
      .bucket(recidivizAuthBucketName)
      .file(`${email}.json`)
      .download()
  )[0];

  const contents = JSON.parse(jsonFile.toString());
  const allowedStates: Array<string> = (contents.allowedStates ?? []).map(
    (sc: string) => sc.toUpperCase(),
  );

  return allowedStates;
}

export async function getRecidivizUserProfile(
  email: string,
): Promise<AuthorizedUserProfile> {
  // verify that it's a recidiviz email
  if (!email.endsWith("@recidiviz.org"))
    throw new Error("Invalid email address");

  return {
    stateCode: "RECIDIVIZ",
    allowedStates: await getAllowedStates(email),
    permissions: ["enhanced", "live_data"],
  };
}
