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
   * 1. Prevent users from signing up that are not in the allow list
   * 2. Add the user's state_code to the app_metadata
   * 3. Fetch any user restrictions and add them to the user's app_metadata
   *
   */

  /** Set up external clients and dependencies */
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

  /** 1. Domain allow list for registration */
  const email = event.user.email;
  const authorizedDomains = ["recidiviz.org", "csg.org"]; // add authorized domains here
  const emailSplit = (event.user.email && event.user.email.split("@")) ?? [""];
  const userDomain = emailSplit[emailSplit.length - 1].toLowerCase();

  // Add any additional email authorization overrides
  const authorizedEmails = [];
  const testerEmails = [];

  const userHasAccess =
    authorizedDomains.some(function (authorizedDomain) {
      return userDomain === authorizedDomain;
    }) ||
    (email && authorizedEmails.includes(email));

  if (userHasAccess) {
    if (email && testerEmails.includes(email)) {
      // Do not check permissions for test users
      return;
    }

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

    const acceptedStateCodes = [
      "ca",
      "co",
      "id",
      "mo",
      "nd",
      "or",
      "pa",
      "me",
      "mi",
      "tn",
    ];
    const domainSplit = userDomain.split(".");

    // assumes the state is always the second to last component of the domain
    // e.g. @doc.mo.gov or @nd.gov, but not @nd.docr.gov
    let state = domainSplit[domainSplit.length - 2].toLowerCase();

    // Some states do not use the abbreviation in their email addresses
    const stateCodeMapping = {
      idaho: "id",
      maine: "me",
      michigan: "mi",

      // Some oregon users have county email addresses
      oregon: "or",
      deschutes: "or",
      clackamas: "or",
    };

    if (
      state in stateCodeMapping ||
      (email && authorizedEmails.includes(email))
    ) {
      state = stateCodeMapping[state];
    }

    const stateCode = `us_${state}`;

    /** 2. If state code is us_pa, add state code to the app metadata and return
     *  since those user's aren't in the admin panel roster
     */
    // TODO (#4639) Remove PA specific logic once PA users are in Admin Panel roster
    if (stateCode === "us_pa") {
      api.user.setAppMetadata("stateCode", stateCode);
      // TODO #3170 Remove this once UserAppMetadata has been transitioned
      api.user.setAppMetadata("state_code", stateCode);
      return;
    }

    /** 3. All other users, request metadata and permissions from the auth
     * endpoint and update app metadata */
    if (acceptedStateCodes.includes(state)) {
      try {
        const auth = new GoogleAuth({ credentials });
        const client = await auth.getIdTokenClient(
          event.secrets.TARGET_AUDIENCE,
        );

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
          !!restrictions.routes ||
          Object.keys(restrictions.routes).length === 0;
        // Users in lantern states are allowed to have no routes; they'll just get redirected to
        // lantern. TODO(#4731): restrict lantern access based on routes.
        const hasLanternAccess = stateCode === "us_mo" || stateCode === "us_pa";
        if (hasNoPermissions && !hasLanternAccess) {
          throw new Error("User has no permissions");
        }

        api.user.setAppMetadata("stateCode", stateCode);
        // TODO #3170 Remove this once UserAppMetadata has been transitioned
        api.user.setAppMetadata("state_code", stateCode);
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
        api.user.setAppMetadata(
          "featureVariants",
          restrictions.featureVariants,
        );

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
          `Error while registering new user for state code ${stateCode} and email ${email}.`,
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
    }
  } else {
    const errorMessage = `Error user with email ${email} is not authorized to register.`;
    Sentry.captureException(new Error(errorMessage), {
      tags: {
        clientName: event.client && event.client.name,
        clientId: event.client && event.client.client_id,
      },
    });

    api.access.deny(
      `User ${email} does not have access to register.`,
      clientMessage,
    );
    return;
  }
};
