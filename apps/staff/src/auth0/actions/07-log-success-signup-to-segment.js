/**
 * Handler that will be called during the execution of a PostUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that has registered.
 * @param {PostUserRegistrationAPI} api - Methods and utilities to help change the behavior after a signup.
 */
exports.onExecutePostUserRegistration = async (event, api) => {
  const Analytics = require("analytics-node");
  const analytics = new Analytics(event.secrets.SEGMENT_WRITE_KEY, {
    flushAt: 1,
  });

  const { user } = event;

  analytics.track({
    userId: user.user_id,
    event: "Success Signup",
    properties: {
      ...user.app_metadata,
      email: user.email,
      email_verified: user.email_verified,
      last_ip: event?.request?.ip,
      logins_count: 1,
      name: user.name,
      nickname: user.nickname,
      picture: user.picture,
      updated_at: user.updated_at,
      user_id: user.user_id,
    },
  });

  await analytics.flush();
};
