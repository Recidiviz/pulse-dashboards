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

const { Storage } = require("@google-cloud/storage");

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const { app_metadata, email } = event.user;
  const emailSplit = email?.split("@") || [];
  const userDomain =
    (email?.length ?? 0) > 1 && emailSplit[emailSplit.length - 1].toLowerCase();

  if (userDomain === "recidiviz.org") {
    const { stateCode, permissions } = app_metadata;
    // defer to existing values so people can make manual overrides for testing, etc
    if (!stateCode) {
      api.user.setAppMetadata("stateCode", "RECIDIVIZ");
    }
    if (!permissions) {
      api.user.setAppMetadata("permissions", ["enhanced"]);
    }

    // the full credential exceeds the secrets character limit,
    // which is why the private key field is stored separately (it is by far the largest value)
    const credentials = {
      ...JSON.parse(event.secrets.GOOGLE_APPLICATION_CREDENTIALS),
      // string contains newlines, which we need to render as \n codes for valid JSON
      private_key:
        event.secrets.GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY.replace(
          /\\n/gm,
          "\n",
        ),
    };

    const storage = new Storage({
      projectId: event.secrets.PROJECT_ID,
      credentials,
    });

    const recidivizAuthBucketName = event.secrets.RECIDIVIZ_AUTH_BUCKET_NAME;
    const jsonFile = await storage
      .bucket(recidivizAuthBucketName)
      .file(`${email}.json`)
      .download();

    const contents = JSON.parse(jsonFile);
    const allowedStates = (contents.allowedStates ?? []).map((sc) =>
      sc.toUpperCase(),
    );

    // for this it is important NOT to defer to manual overrides,
    // for security/compliance reasons
    api.user.setAppMetadata("allowedStates", allowedStates);
  }
};
