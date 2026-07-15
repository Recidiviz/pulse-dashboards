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

// Scratch script to manually exercise the Linear deploy-notification helpers against
// a real ticket, without running the full deploy pipeline. Delete after use.
//
// Run one env at a time so you can verify the result in Linear before moving on:
//   tsx tools/scratch-test-linear.mts staging
//   tsx tools/scratch-test-linear.mts production

import { createLinearClient } from "../deploy/clients.mts";
import {
  commentOnManualTestingTickets,
  setDeployStatusLabel,
} from "../deploy/linear.mts";

const testTicketId = "OBT-39280";

const env = process.argv[2];
if (env !== "staging" && env !== "production") {
  throw new Error(
    `Usage: tsx tools/scratch-test-linear.mts <staging|production> (got ${JSON.stringify(env)})`,
  );
}

const linear = await createLinearClient();

await setDeployStatusLabel(linear, testTicketId, env);
console.log(
  `Labeled ${testTicketId} as ${env === "staging" ? "Staging" : "Production"} Deploy — check the ticket in Linear.`,
);

if (env === "production") {
  // Only produces a comment if testTicketId already has the "Requires Manual
  // Testing on Production" label and an assignee.
  await commentOnManualTestingTickets(linear, [testTicketId]);
  console.log(
    `Ran commentOnManualTestingTickets for ${testTicketId} — check for a new comment.`,
  );
}
