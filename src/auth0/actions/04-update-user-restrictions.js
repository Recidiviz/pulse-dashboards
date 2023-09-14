/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  /** Set up external clients and dependencies */
  const Base64 = require("crypto-js/enc-base64");
  const SHA256 = require("crypto-js/sha256");
  const Analytics = require("analytics-node");
  const analytics = new Analytics(event.secrets.SEGMENT_WRITE_KEY, {
    flushAt: 1,
  });

  const Sentry = require("@sentry/node");
  const { GoogleAuth } = require("google-auth-library");

  Sentry.init({
    dsn: event.secrets.SENTRY_DSN,
    environment: event.secrets.SENTRY_ENV,
  });

  let credentials = JSON.parse(event.secrets.GOOGLE_APPLICATION_CREDENTIALS);
  const privateKey = event.secrets.PRIVATE_KEY.replace(/\\n/gm, "\n");
  credentials = { ...credentials, private_key: privateKey };

  const { Storage } = require("@google-cloud/storage");
  const storage = new Storage({
    projectId: event.secrets.PROJECT_ID,
    credentials,
  });

  const { app_metadata, email } = event.user;
  let stateCode = app_metadata.state_code?.toLowerCase();

  /** Set LANTERN state code to CSG */
  if (stateCode === "lantern") {
    stateCode = "csg";
    api.user.setAppMetadata("state_code", stateCode);
  }
  const authorizedDomains = ["recidiviz.org", "csg.org", "recidiviz-test.org"]; // add authorized domains here
  const statesWithRestrictions = [
    "us_co",
    "us_id",
    "us_me",
    "us_mi",
    "us_mo",
    "us_nd",
    "us_tn",
  ];
  const emailSplit = email?.split("@") || [];
  const userDomain =
    (email?.length ?? 0) > 1 && emailSplit[emailSplit.length - 1].toLowerCase();

  const DENY_MESSAGE =
    "There was a problem authorizing your account. Please contact your organization administrator. " +
    "If you don’t know your administrator, contact feedback@recidiviz.org.";

  if (app_metadata.skip_sync_permissions) {
    return;
  }

  /** Set stateCode in appMetadata for everyone. */
  api.user.setAppMetadata("stateCode", stateCode);

  /** Set route permissions for CSG users. */
  if (stateCode === "csg") {
    api.user.setAppMetadata("routes", {
      system_libertyToPrison: true,
      system_prison: true,
      system_prisonToSupervision: true,
      system_supervision: true,
      system_supervisionToLiberty: true,
      system_supervisionToPrison: true,
    });
  }

  /**
   * Set allowedStateCodes from Recidiviz users and skip adding
   * restrictions for Recidiviz and CSG users
   */
  if (authorizedDomains.includes(userDomain)) {
    if (userDomain === "recidiviz.org") {
      const recidivizAuthBucketName = event.secrets.RECIDIVIZ_AUTH_BUCKET_NAME;
      const jsonFile = await storage
        .bucket(recidivizAuthBucketName)
        .file(`${email}.json`)
        .download();

      const contents = JSON.parse(jsonFile);
      const allowedStates = (contents.allowedStates ?? []).map((sc) =>
        sc.toUpperCase()
      );
      api.user.setAppMetadata("allowedStates", allowedStates);
    }
    return;
  }

  /**
   * Set user restrictions from Admin Panel backend for all users other than Recidiviz and CSG.
   */
  if (statesWithRestrictions.includes(stateCode)) {
    try {
      /** Get user restrictions from Admin Panel backend */
      const auth = new GoogleAuth({ credentials });
      const client = await auth.getIdTokenClient(event.secrets.TARGET_AUDIENCE);

      // some ID accounts come up with an onmicrosoft domain. This patches the email for the request
      const request_email = event.user.email?.replace(
        "iddoc.onmicrosoft.com",
        "idoc.idaho.gov"
      );

      let userHash = Base64.stringify(SHA256(request_email?.toLowerCase()));
      if (userHash.startsWith("/")) {
        userHash = userHash.replace("/", "_");
      }
      const url = `${event.secrets.RECIDIVIZ_APP_URL}auth/users/${userHash}`;

      const apiResponse = await client.request({ url, retry: true });
      const restrictions = apiResponse.data;

      const arrayOfLocations =
        (restrictions.allowedSupervisionLocationIds ?? "") === ""
          ? []
          : restrictions.allowedSupervisionLocationIds.split(",");

      /** Add restrictions to app_metadata */
      api.user.setAppMetadata(
        "allowedSupervisionLocationIds",
        arrayOfLocations
      );
      api.user.setAppMetadata(
        "allowedSupervisionLocationLevel",
        restrictions.allowedSupervisionLocationLevel
      );
      api.user.setAppMetadata("routes", restrictions.routes || null);
      api.user.setAppMetadata("stateCode", stateCode);
      api.user.setAppMetadata("userHash", restrictions.userHash);
      api.user.setAppMetadata("role", restrictions.role || null);
      api.user.setAppMetadata("district", restrictions.district);
      api.user.setAppMetadata("externalId", restrictions.externalId);
      api.user.setAppMetadata("featureVariants", restrictions.featureVariants);

      // TODO #3170 Remove these once UserAppMetadata has been transitioned
      api.user.setAppMetadata(
        "allowed_supervision_location_ids",
        arrayOfLocations
      );
      api.user.setAppMetadata(
        "allowed_supervision_location_level",
        restrictions.allowedSupervisionLocationLevel
      );
      api.user.setAppMetadata("user_hash", restrictions.userHash);
    } catch (apiError) {
      const { user } = event;

      analytics.track({
        userId: user.user_id,
        event: "Failed Login",
        properties: {
          ...user.app_metadata,
          email: user.email,
          email_verified: user.email_verified,
          identities: user.identities,
          last_ip: event.request.ip,
          logins_count: event.stats.logins_count,
          name: user.name,
          nickname: user.nickname,
          picture: user.picture,
          updated_at: user.updated_at,
          user_id: user.user_id,
        },
      });

      await analytics.flush();
      api.access.deny(DENY_MESSAGE);
    }
  }
};
