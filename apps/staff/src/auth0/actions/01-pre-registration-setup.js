/**
 * Handler that will be called during the execution of a PreUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  /**
   * This hook allows custom code to prevent creation of a user in the
   * database or to add custom app_metadata or user_metadata to a
   * newly created user.
   *
   * Only one pre-user registration hook can be enabled at a time.
   *
   * This hook will do three things:
   * 1. Add permissions for csg and recidiviz users
   * 2. Fetch permissions fom the backend for state users
   * 3. Ensure the registering user's domain is allowed for the returned state
   *
   */

  const allowedDomainsForState = {
    US_AR: ["arkansas.gov", "doc.arkansas.gov"],
    US_AZ: ["azadc.gov", "corecivic.com", "geogroup.com"],
    US_CA: ["cdcr.ca.gov"],
    US_CO: ["state.co.us", "coag.gov"],
    US_ID: ["idoc.idaho.gov"],
    US_ME: ["maine.gov"],
    US_MI: ["michigan.gov"],
    US_MO: ["doc.mo.gov"],
    US_ND: ["nd.gov"],
    US_OR: ["doc.oregon.gov", "clackamas.us", "deschutes.org"],
    US_PA: ["pa.gov"],
    US_TN: ["tn.gov", "corecivic.com"],
  };

  /** Set up external clients and dependencies **/
  const Sentry = require("@sentry/node");
  const { GoogleAuth } = require("google-auth-library");
  const Base64 = require("crypto-js/enc-base64");
  const SHA256 = require("crypto-js/sha256");

  const privateKey = event.secrets.PRIVATE_KEY.replace(/\\n/gm, "\n");
  let credentials = JSON.parse(event.secrets.GOOGLE_APPLICATION_CREDENTIALS);
  credentials = { ...credentials, private_key: privateKey };

  const { Storage } = require("@google-cloud/storage");
  const storage = new Storage({
    projectId: event.secrets.PROJECT_ID,
    credentials,
  });

  Sentry.init({
    dsn: event.secrets.SENTRY_DSN,
    environment: event.secrets.SENTRY_ENV,
  });
  const clientMessage =
    "There was a problem registering your account. Please contact your organization administrator, if you don’t know your administrator, contact feedback@recidiviz.org.";

  /** Extract domain for registration **/
  const email = event.user.email;
  const emailSplit = (email && email.split("@")) ?? [""];
  const userDomain = emailSplit[emailSplit.length - 1].toLowerCase();

  /** 1. Special-case Recidiviz and CSG users **/
  // Set state_code for CSG users
  if (userDomain === "csg.org") {
    api.user.setAppMetadata("stateCode", "CSG");
    // TODO #3170 Remove this once UserAppMetadata has been transitioned
    api.user.setAppMetadata("state_code", "CSG");
    /** Set route permissions */
    api.user.setAppMetadata("routes", {
      system_libertyToPrison: true,
      system_prison: true,
      system_prisonToSupervision: true,
      system_supervision: true,
      system_supervisionToLiberty: true,
      system_supervisionToPrison: true,
      insights: true,
      "insights_supervision_supervisors-list": true,
      lantern: true,
    });
    api.user.setAppMetadata("featureVariants", {
      responsiveRevamp: true,
    });
    return;
  }

  // Set state_code for Recidiviz users
  if (
    userDomain === "recidiviz.org" &&
    !event.user?.app_metadata?.recidiviz_tester
  ) {
    /** Get Recidiviz user's allowed states */
    const recidivizAuthBucketName = event.secrets.RECIDIVIZ_AUTH_BUCKET_NAME;
    const jsonFile = await storage
      .bucket(recidivizAuthBucketName)
      .file(`${email}.json`)
      .download();

    const contents = JSON.parse(jsonFile);
    const allowedStates = (contents.allowedStates ?? []).map((sc) =>
      sc.toUpperCase(),
    );
    api.user.setAppMetadata("allowedStates", allowedStates);
    api.user.setAppMetadata("stateCode", "recidiviz");
    // TODO #3170 Remove this once UserAppMetadata has been transitioned
    api.user.setAppMetadata("state_code", "recidiviz");
    return;
  }

  /** 2. All other users, request metadata and permissions from the auth
   * endpoint and update app metadata **/
  try {
    const privateKey = event.secrets.PRIVATE_KEY.replace(/\\n/gm, "\n");
    let credentials = JSON.parse(event.secrets.GOOGLE_APPLICATION_CREDENTIALS);
    credentials = { ...credentials, private_key: privateKey };
    const auth = new GoogleAuth({ credentials });
    const client = await auth.getIdTokenClient(event.secrets.TARGET_AUDIENCE);

    let userHash = Base64.stringify(SHA256(email?.toLowerCase()));
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
      !restrictions.routes || Object.keys(restrictions.routes).length === 0;

    if (hasNoPermissions) {
      throw new Error("User has no permissions");
    }

    const { stateCode } = restrictions;

    /** 3. Ensure that the returned state is allowed for the given domain.
     * Prevent registration if not. **/
    if (
      userDomain !== "recidiviz-test.org" &&
      !allowedDomainsForState[stateCode].includes(userDomain)
    ) {
      throw new Error(
        `Email ${email} not allowed to register for state ${stateCode}`,
      );
    }

    api.user.setAppMetadata("stateCode", restrictions.stateCode);
    // TODO #3170 Remove this once UserAppMetadata has been transitioned
    api.user.setAppMetadata("state_code", restrictions.stateCode);
    api.user.setAppMetadata(
      "allowedSupervisionLocationIds",
      !restrictions.allowedSupervisionLocationIds
        ? []
        : restrictions.allowedSupervisionLocationIds.split(","),
    );
    api.user.setAppMetadata(
      "allowedSupervisionLocationLevel",
      restrictions.allowedSupervisionLocationLevel,
    );
    api.user.setAppMetadata("routes", restrictions.routes || null);
    api.user.setAppMetadata("userHash", restrictions.userHash);
    api.user.setAppMetadata("district", restrictions.district);
    api.user.setAppMetadata("externalId", restrictions.externalId);
    api.user.setAppMetadata("featureVariants", restrictions.featureVariants);

    // TODO #3170 Remove these once UserAppMetadata has been transitioned
    api.user.setAppMetadata("user_hash", restrictions.userHash);
    api.user.setAppMetadata(
      "allowed_supervision_location_ids",
      !restrictions.allowedSupervisionLocationIds
        ? []
        : restrictions.allowedSupervisionLocationIds.split(","),
    );
    api.user.setAppMetadata(
      "allowed_supervision_location_level",
      restrictions.allowedSupervisionLocationLevel,
    );

    return;
  } catch (apiError) {
    Sentry.captureMessage(
      `Error while registering new user for email ${email}.`,
    );
    Sentry.captureException(apiError, {
      tags: {
        clientName: event.client && event.client.name,
        clientId: event.client && event.client.client_id,
      },
    });
    api.access.deny(apiError.message, clientMessage);
    return;
  }
};
