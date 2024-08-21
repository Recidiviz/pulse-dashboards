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

  // Skip email verification on OpenID and SAML connections
  if (
    event.connection.name.includes("OpenID") ||
    event.connection.name.includes("SAML")
  ) {
    return;
  }

  if (!event.user.email_verified) {
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
    api.redirect.sendUserTo("https://dashboard.recidiviz.org/verify");
  }
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
// exports.onContinuePostLogin = async (event, api) => {
// };
