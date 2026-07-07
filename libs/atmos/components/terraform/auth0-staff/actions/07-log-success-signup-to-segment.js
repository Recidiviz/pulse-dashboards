// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

function getUserEmail(event) {
  const { email, emailaddress, emailAddress } = event.user;
  return email ?? emailaddress ?? emailAddress;
}

/**
 * Handler that will be called during the execution of a PostUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that has registered.
 * @param {PostUserRegistrationAPI} api - Methods and utilities to help change the behavior after a signup.
 */
exports.onExecutePostUserRegistration = async (event) => {
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
    event: "Success Signup",
    properties: {
      ...appMetadataForTracking,
      email: getUserEmail(event),
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
