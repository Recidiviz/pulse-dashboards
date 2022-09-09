// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

function setStateCodeMetadata(user, context, callback) {
  user.app_metadata = user.app_metadata || {};

  const emailSplit = user.email.split('@');
  const domain = emailSplit[emailSplit.length - 1].toLowerCase();

  // update the app_metadata that will be part of the response
  if (domain === 'recidiviz.org') {
    user.app_metadata.state_code = 'recidiviz';
  }
  else {
    const domainSplit = domain.split('.');
    // assumes the state is always the second to last component of the domain
    // e.g. @doc.mo.gov or @nd.gov, but not @nd.docr.gov
    const state = domainSplit[domainSplit.length - 2].toLowerCase();
    const stateCode = `us_${state}`;
    user.app_metadata.state_code = stateCode;
  }

  // persist the app_metadata update
  auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
    .then(function() {
      callback(null, user, context);
    })
    .catch(function(err) {
      callback(err);
    });
}
