/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const Analytics = require("analytics-node");
  const analytics = new Analytics(event.secrets.SEGMENT_WRITE_KEY, {
    flushAt: 1,
  });
  const { app_metadata } = event.user;
  const DENY_MESSAGE =
    "There was a problem authorizing your account. Please contact feedback@recidiviz.org.";

  if (!app_metadata.state_code) {
    const connectionToStateCode = {
      [event.secrets.RECIDIVIZ_CONNECTION_ID]: "recidiviz",
      // NOTE: delete the following lines for staging
      [event.secrets.US_IA_CONNECTION_ID]: "us_ia",
      [event.secrets.US_ID_CONNECTION_ID]: "us_id",
      [event.secrets.US_MI_CONNECTION_ID]: "us_mi",
      [event.secrets.US_ME_CONNECTION_ID]: "us_me",
      [event.secrets.US_ND_CONNECTION_ID]: "us_nd",
      [event.secrets.US_TN_CONNECTION_ID]: "us_tn",
      [event.secrets.US_CA_CONNECTION_ID]: "us_ca",
      [event.secrets.US_AZ_CONNECTION_ID]: "us_az",
      [event.secrets.US_TX_CONNECTION_ID]: "us_tx",
      [event.secrets.US_PA_CONNECTION_ID]: "us_pa",
    };

    const connection = event.connection.id;
    if (connection in connectionToStateCode) {
      api.user.setAppMetadata("stateCode", connectionToStateCode[connection]);
      // TODO #3170 Remove this once UserAppMetadata has been transitioned
      api.user.setAppMetadata("state_code", connectionToStateCode[connection]);
    } else {
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
