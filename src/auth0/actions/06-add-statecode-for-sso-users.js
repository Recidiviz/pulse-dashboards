/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  const { app_metadata } = event.user;
  const DENY_MESSAGE = 'There was a problem authorizing your account. Please contact your organization administrator. ' +
  'If you don’t know your administrator, contact feedback@recidiviz.org.';

  if (!app_metadata.state_code) {
    const connectionToStateCode = {
      [event.secrets.RECIDIVIZ_CONNECTION_ID]: "recidiviz",
      // NOTE: delete the following lines for staging
      [event.secrets.US_ID_CONNECTION_ID]: "us_id",
    };

    const connection = event.connection.id;
    if (connection in connectionToStateCode) {
      api.user.setAppMetadata("state_code", connectionToStateCode[connection]);
    } else {
      api.access.deny(DENY_MESSAGE);
      return;
    }
  }
};

