/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
const crypto = require("crypto");

function generateSegmentId(event) {
  const email = Buffer.from(event.user.email, "utf8");
  return crypto.createHash("sha256").update(email).digest("base64");
}

function generateIntercomId(event) {
  const data = Buffer.from(generateSegmentId(event), "utf8");
  return crypto
    .createHmac("sha256", event.secrets.INTERCOM_APP_KEY)
    .update(data)
    .digest("hex");
}

exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://dashboard.recidiviz.org";
  api.idToken.setCustomClaim(
    `${namespace}/user_metadata`,
    event.user.user_metadata,
  );
  api.idToken.setCustomClaim(`${namespace}/app_metadata`, {
    ...event.user.app_metadata,
    segmentId: generateSegmentId(event),
    intercomId: generateIntercomId(event),
    // TODO #3170 Remove these once UserAppMetadata has been transitioned
    segment_id: generateSegmentId(event),
    intercom_id: generateIntercomId(event),
  });
  api.accessToken.setCustomClaim(
    `${namespace}/app_metadata`,
    event.user.app_metadata,
  );
  api.accessToken.setCustomClaim(
    `${namespace}/registration_date`,
    event.user.created_at,
  );
  api.accessToken.setCustomClaim(
    `${namespace}/email_address`,
    event.user.email,
  );
};
