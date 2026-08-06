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

// eslint-disable-next-line @nx/enforce-module-boundaries
import { resourceApiClient } from "../../../../../libs/@jii/trpc/src/router/routes/resident/resources/resourceApiClient";

const STATE_CODE = "US_NYC";

const organizations = await resourceApiClient.getOrganizations(STATE_CODE);
console.log(`Fetched ${organizations.length} organizations for ${STATE_CODE}`);
console.log(JSON.stringify(organizations.slice(0, 3), null, 2));

const resource = organizations[0];
if (resource) {
  console.log(`\nFetching detail for organization ${resource.organizationId}…`);
  const detail = await resourceApiClient.getOrganization(
    resource.organizationId,
  );
  console.log(JSON.stringify(detail, null, 2));
}
