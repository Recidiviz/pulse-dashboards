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

require("dotenv").config();
const { ManagementClient } = require("auth0");

const management = new ManagementClient({
  domain: process.env.domain,
  clientId: process.env.m2m_clientId,
  clientSecret: process.env.m2m_clientSecret,
});

// Set to true to test without making actual updates
const DRY_RUN = true;

const SEPARATOR_WIDTH = 80;

// Permissions to add to the users' app_metadata
const PERMISSIONS_TO_ADD = {
  routes: {
    cpa: true,
  },
};

async function listUsers() {
  console.log("Fetching users from Auth0...\n");

  const response = await management.users.list();
  const users = response.response.users;

  console.log(`Found ${users.length} users:\n`);
  console.log("=".repeat(SEPARATOR_WIDTH));

  for (const user of users) {
    console.log(`\nEmail: ${user.email || "N/A"}`);

    if (user.app_metadata && Object.keys(user.app_metadata).length > 0) {
      console.log(`User has app metadata.`);
      console.log(JSON.stringify(user.app_metadata, null, 2));
    } else {
      console.log(`App Metadata: None`);
    }

    console.log("-".repeat(SEPARATOR_WIDTH));
  }

  return users;
}

async function updateUsersMetadata(usersToUpdate, newMetadata) {
  console.log(`\nUpdating ${usersToUpdate.length} user(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of usersToUpdate) {
    console.log(`\n${"=".repeat(SEPARATOR_WIDTH)}`);
    console.log(`Processing: ${user.email || user.user_id}`);
    console.log("=".repeat(SEPARATOR_WIDTH));

    console.log(`User ID: ${user.user_id}`);
    console.log(`Name: ${user.name}`);

    const currentAppMetadata = user.app_metadata || {};
    console.log(
      "\nCurrent app_metadata:",
      JSON.stringify(currentAppMetadata, null, 2),
    );

    const updatedAppMetadata = {
      ...currentAppMetadata,
      ...newMetadata,
    };

    console.log(
      "\nUpdated app_metadata:",
      JSON.stringify(updatedAppMetadata, null, 2),
    );

    try {
      if (!DRY_RUN) {
        // eslint-disable-next-line no-await-in-loop
        await management.users.update(user.user_id, {
          app_metadata: updatedAppMetadata,
        });
        console.log(`\n✓ Successfully updated ${user.email || user.user_id}`);
      } else {
        console.log(`\n✓ [DRY RUN] Would update ${user.email || user.user_id}`);
      }
      successCount++;
    } catch (updateError) {
      console.error(
        `✗ Failed to update ${user.email || user.user_id}:`,
        updateError.message,
      );
      failCount++;
    }
  }

  console.log(`\n${"=".repeat(SEPARATOR_WIDTH)}`);
  console.log("SUMMARY");
  console.log("=".repeat(SEPARATOR_WIDTH));
  console.log(`Total users processed: ${usersToUpdate.length}`);
  console.log(`Successful updates: ${successCount}`);
  console.log(`Failed updates: ${failCount}`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  // Fetch all users first
  const allUsers = await listUsers();
  const usersToUpdate = allUsers;
  await updateUsersMetadata(usersToUpdate, PERMISSIONS_TO_ADD);
}

main().catch(console.error);
