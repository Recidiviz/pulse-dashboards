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

  /** Set featureVariants to allow CSG access to insights (permission is still required) */
  if (stateCode === "csg") {
    api.user.setAppMetadata("featureVariants", {
      insightsLeadershipPageAllDistricts: true,
    });
    return;
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
        sc.toUpperCase(),
      );
      if (
        allowedStates.length === 0 ||
        (allowedStates.length === 1 && allowedStates[0] === "US_OZ")
      ) {
        api.access.deny(
          "No access granted to state data. " +
            "Please contact the security team at security@recidiviz.org to make sure your permissions are up-to-date.",
        );
      } else {
        api.user.setAppMetadata("allowedStates", allowedStates);
      }
    }
    return;
  }

  /**
   * Set user restrictions from Admin Panel backend for all users other than Recidiviz and CSG.
   */
  try {
    /** Get user restrictions from Admin Panel backend */
    const auth = new GoogleAuth({ credentials });
    const client = await auth.getIdTokenClient(event.secrets.TARGET_AUDIENCE);

    // some ID accounts come up with an onmicrosoft domain. This patches the email for the request
    const request_email = event.user.email?.replace(
      "iddoc.onmicrosoft.com",
      "idoc.idaho.gov",
    );

    let userHash = Base64.stringify(SHA256(request_email?.toLowerCase()));
    if (userHash.startsWith("/")) {
      userHash = userHash.replace("/", "_");
    }
    const url = `${event.secrets.RECIDIVIZ_APP_URL}auth/users/${userHash}`;

    const apiResponse = await client.request({ url, retry: true });
    const restrictions = apiResponse.data;

    // If a user has no routes but is in our roster, treat them as if they weren't in the roster at
    // all. This can happen when a state is on roster sync and a user exists in the synced roster,
    // but the data doesn't show them as being supervision line staff or a supervision supervisor.
    // In that case, they will have a role of "unknown" and no permissions.
    const hasNoPermissions =
      !!restrictions.routes || Object.keys(restrictions.routes).length === 0;
    // Users in lantern states are allowed to have no routes; they'll just get redirected to
    // lantern. TODO(#4731): restrict lantern access based on routes.
    const hasLanternAccess = stateCode === "us_mo" || stateCode === "us_pa";
    if (hasNoPermissions && !hasLanternAccess) {
      throw new Error("User has no permissions");
    }

    const arrayOfLocations =
      (restrictions.allowedSupervisionLocationIds ?? "") === ""
        ? []
        : restrictions.allowedSupervisionLocationIds.split(",");

    /** Add restrictions to app_metadata */
    api.user.setAppMetadata("allowedSupervisionLocationIds", arrayOfLocations);
    api.user.setAppMetadata(
      "allowedSupervisionLocationLevel",
      restrictions.allowedSupervisionLocationLevel,
    );
    api.user.setAppMetadata("routes", restrictions.routes || null);
    api.user.setAppMetadata("stateCode", stateCode);
    api.user.setAppMetadata("userHash", restrictions.userHash);
    api.user.setAppMetadata("pseudonymizedId", restrictions.pseudonymizedId);
    api.user.setAppMetadata("district", restrictions.district);
    api.user.setAppMetadata("externalId", restrictions.externalId);
    api.user.setAppMetadata("featureVariants", restrictions.featureVariants);

    // TODO #3170 Remove these once UserAppMetadata has been transitioned
    api.user.setAppMetadata(
      "allowed_supervision_location_ids",
      arrayOfLocations,
    );
    api.user.setAppMetadata(
      "allowed_supervision_location_level",
      restrictions.allowedSupervisionLocationLevel,
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
};
