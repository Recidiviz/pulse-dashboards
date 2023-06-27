// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  const Analytics = require('analytics-node');
  const analytics = new Analytics(event.secrets.SEGMENT_WRITE_KEY, { flushAt: 1  });

  const testerEmails = [
    /* Update test emails used in Auth0 Actions */
  ];
  if (
    testerEmails.includes(event.user.email) &&
    event.client.name !== "Recidiviz Dashboard Demo"
  ) {
    const { user } = event;

    analytics.track({
      userId: user.user_id,
      event: 'Failed Login',
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
      }
    });

    await analytics.flush();
    api.access.deny(`Access to ${event.client.name} is not allowed.`);
  }
};
