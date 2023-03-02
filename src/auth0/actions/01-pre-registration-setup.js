// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
  const Sentry = require("@sentry/node");
  const { GoogleAuth } = require("google-auth-library");
  Sentry.init({
    dsn: event.secrets.SENTRY_DSN,
    environment: event.secrets.SENTRY_ENV,
  });
  const clientMessage =
    "There was a problem registering your account. Please contact your organization administrator, if you don’t know your administrator, contact feedback@recidiviz.org.";

  /** 1. Domain allow list for registration */
  const authorizedDomains = ["recidiviz.org", "csg.org"]; // add authorized domains here
  const emailSplit = event.user.email && event.user.email.split("@");
  const userDomain = emailSplit[emailSplit.length - 1].toLowerCase();

  // Add any additional email authorization overrides
  const authorizedEmails = [];

  const userHasAccess =
    authorizedDomains.some(function (authorizedDomain) {
      return userDomain === authorizedDomain;
    }) ||
    (event.user.email && authorizedEmails.includes(event.user.email));

  if (userHasAccess) {
    if (event.user.email && testerEmails.includes(event.user.email)) {
      // Do not check permissions for test users
      return;
    }

    // Set state_code for CSG users
    if (userDomain === "csg.org") {
      api.user.setAppMetadata("state_code", "lantern");
      return;
    }

    // Set state_code for Recidiviz users
    if (
      userDomain === "recidiviz.org" &&
      !event.user?.app_metadata?.recidiviz_tester
    ) {
      api.user.setAppMetadata("state_code", "recidiviz");
      return;
    }

    /** 2. Add user's state_code to the app_metadata */
    const acceptedStateCodes = ["co", "id", "mo", "nd", "pa", "me", "mi", "tn"];
    const domainSplit = userDomain.split(".");

    // assumes the state is always the second to last component of the domain
    // e.g. @doc.mo.gov or @nd.gov, but not @nd.docr.gov
    let state = domainSplit[domainSplit.length - 2].toLowerCase();

    // Some states do not use the abbreviation in their email addresses
    const stateCodeMapping = {
      idaho: "id",
      maine: "me",
      michigan: "mi",
    };

    if (
      state in stateCodeMapping ||
      (event.user.email && authorizedEmails.includes(event.user.email))
    ) {
      state = stateCodeMapping[state];
    }

    const stateCode = `us_${state}`;

    if (acceptedStateCodes.includes(state)) {
      api.user.setAppMetadata("state_code", stateCode);
    }

    /** 3. Add the user's restrictions to the app_metadata */
    // Other states do not currently have any sign up or user restrictions
    const stateCodesWithRestrictions = [
      "us_co",
      "us_id",
      "us_me",
      "us_mi",
      "us_mo",
      "us_nd",
      "us_tn",
    ];

    if (stateCodesWithRestrictions.includes(stateCode.toLowerCase())) {
      try {
        const privateKey = event.secrets.PRIVATE_KEY.replace(/\\n/gm, "\n");
        let credentials = JSON.parse(
          event.secrets.GOOGLE_APPLICATION_CREDENTIALS
        );
        credentials = { ...credentials, private_key: privateKey };
        const auth = new GoogleAuth({ credentials });
        const client = await auth.getIdTokenClient(
          event.secrets.TARGET_AUDIENCE
        );
        const url = `${event.secrets.RECIDIVIZ_APP_URL}/auth/dashboard_user_restrictions_by_email?email_address=${event.user.email}&region_code=${stateCode}`;
        const apiResponse = await client.request({ url, retry: true });
        const restrictions = apiResponse.data;

        api.user.setAppMetadata(
          "allowed_supervision_location_ids",
          restrictions.allowed_supervision_location_ids || []
        );
        api.user.setAppMetadata(
          "allowed_supervision_location_level",
          restrictions.allowed_supervision_location_level
        );
        api.user.setAppMetadata(
          "should_see_beta_charts",
          restrictions.should_see_beta_charts || false
        );
        api.user.setAppMetadata("routes", restrictions.routes || null);
        return;
      } catch (apiError) {
        Sentry.captureMessage(
          `Error while registering new user for state code ${stateCode} and email ${event.user.email}.`
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
    const errorMessage = `Error user with email ${event.user.email} is not authorized to register.`;
    Sentry.captureException(new Error(errorMessage), {
      tags: {
        clientName: event.client && event.client.name,
        clientId: event.client && event.client.client_id,
      },
    });

    api.access.deny(
      `User ${event.user.email} does not have access to register.`,
      clientMessage
    );
    return;
  }
};
