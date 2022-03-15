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
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const { app_metadata, email } = event.user;
  const stateCode = app_metadata.state_code?.toLowerCase();
  const authorizedDomains = ["recidiviz.org", "csg.org", "recidiviz-test.org"]; // add authorized domains here
  const emailSplit = email?.split("@") || "";
  const userDomain = emailSplit[emailSplit.length - 1].toLowerCase();

  const DENY_MESSAGE = 'There was a problem authorizing your account. Please contact your organization administrator. ' +
    'If you don’t know your administrator, contact feedback@recidiviz.org.';

  if (app_metadata.skip_sync_permissions ||
    authorizedDomains.some(function (authorizedDomain) {
      return userDomain === authorizedDomain;
    })
  ) {
    return;
  }

  // Specific state code restrictions for Recividiz users
  if (event.user.email === "justine@recidiviz.org") {
    api.user.setAppMetadata("blocked_state_codes", ["us_pa"]);
  }

  if (["us_mo", "us_id", "us_nd", "us_me"].includes(stateCode)) {
    const Sentry = require("@sentry/node");
    const { GoogleAuth } = require('google-auth-library');
    Sentry.init({
      dsn: event.secrets.SENTRY_DSN,
      environment: event.secrets.SENTRY_ENV,
    });
    try {
      let credentials = JSON.parse(
        event.secrets.GOOGLE_APPLICATION_CREDENTIALS
      );
      const privateKey = event.secrets.PRIVATE_KEY.replace(/\\n/gm, '\n')
      credentials = { ...credentials, "private_key": privateKey }
      const auth = new GoogleAuth({ credentials });
      const client = await auth.getIdTokenClient(
        event.secrets.TARGET_AUDIENCE
      );

      // some ID accounts come up with an onmicrosoft domain. This patches the email for the request
      const request_email = event.user.email?.replace("iddoc.onmicrosoft.com", "idoc.idaho.gov");

      const url = `${event.secrets
        .RECIDIVIZ_APP_URL}/auth/dashboard_user_restrictions_by_email?email_address=${request_email}&region_code=${stateCode}`;

      const apiResponse = await client.request({ url, retry: true });
      const restrictions = apiResponse.data;
      api.user.setAppMetadata("allowed_supervision_location_ids", restrictions.allowed_supervision_location_ids || []);
      api.user.setAppMetadata("allowed_supervision_location_level", restrictions.allowed_supervision_location_level);
      api.user.setAppMetadata("can_access_case_triage", restrictions.can_access_case_triage || false);
      api.user.setAppMetadata("can_access_leadership_dashboard", restrictions.can_access_leadership_dashboard || false);
      api.user.setAppMetadata("should_see_beta_charts", restrictions.should_see_beta_charts || false);
      api.user.setAppMetadata("routes", restrictions.routes || null);
    } catch(apiError) {
      Sentry.captureMessage(
        `Error while updating user permissions on login for user: ${event.user.email}`
      );
      Sentry.captureException(apiError, {
        tags: {
          clientName: event.client.name,
          clientId: event.client.client_id,
        },
      });
      api.access.deny(DENY_MESSAGE);
    }
  }
};
