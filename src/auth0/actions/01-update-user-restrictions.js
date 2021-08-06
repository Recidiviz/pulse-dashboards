/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  const stateCode = event.user.app_metadata.state_code.toLowerCase();
  if (["us_mo", "us_id"].includes(stateCode.toLowerCase())) {
    const { GoogleAuth } = require('google-auth-library');
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
      const url = `${event.secrets
        .RECIDIVIZ_APP_URL}/auth/dashboard_user_restrictions_by_email?email_address=${event.user.email}&region_code=${stateCode}`;

      const apiResponse = await client.request({ url, retry: true });
      const restrictions = apiResponse.data;

      api.user.setAppMetadata("allowed_supervision_location_ids", restrictions.allowed_supervision_location_ids || []);
      api.user.setAppMetadata("allowed_supervision_location_level", restrictions.allowed_supervision_location_level);
      api.user.setAppMetadata("can_access_case_triage", restrictions.can_access_case_triage || false);
      api.user.setAppMetadata("can_access_leadership_dashboard", restrictions.can_access_leadership_dashboard || false);
    } catch(apiError) {
      api.access.deny('There was a problem authorizing your account. Please contact your organization administrator, if you don’t know your administrator, contact feedback@recidiviz.org.');
    }
  }
};