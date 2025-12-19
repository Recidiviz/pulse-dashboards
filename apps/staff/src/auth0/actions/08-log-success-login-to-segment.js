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

  const { user } = event;

  // Normalize the values of feature variants to booleans so that Segment will correctly
  // capture values that are an empty object or have an activeDate condition
  const appMetadataForTracking = {
    ...user.app_metadata,
    featureVariants: Object.fromEntries(
      Object.entries(user.app_metadata["featureVariants"] ?? {}).map(
        ([featureVariant, variantInfo]) => {
          // For external users, values should in practice be false or an object
          // But, just to be safe, handle values of true, false, null
          if (variantInfo === true) {
            return [featureVariant, true];
          }
          if (Boolean(variantInfo) === false) {
            return [featureVariant, false];
          }

          // At this point we expect the feature variant value to be an object,
          // which is equivalent to true if it's empty (i.e. the feature variant isn't
          // gated by an active date) or the active date has already passed
          const { activeDate } = variantInfo;
          if (
            activeDate === undefined ||
            new Date(activeDate).getTime() < Date.now()
          ) {
            return [featureVariant, true];
          } else {
            return [featureVariant, false];
          }
        },
      ),
    ),
  };

  analytics.track({
    userId: user.user_id,
    event: "Success Login",
    properties: {
      ...appMetadataForTracking,
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
};
