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

/**
 * Prints the SQL for manually deleting meetings, e.g. so a user can re-upload a
 * local copy of a meeting that failed processing. It never connects to a
 * database: paste the output into a psql session on the right state database.
 *
 * Run `nx delete-meeting-sql @meetings/server --args="--help"` for usage.
 */

import { Command } from "@commander-js/extra-typings";

import { buildDeleteMeetingSql } from "~@meetings/server/scripts/meetings-oncall/delete-sql";

function main(): void {
  const program = new Command()
    .name("delete-meeting-sql")
    .description(
      "Print the SQL to inspect and delete meetings and their transcriptions, utterances, and action items",
    )
    .requiredOption(
      "--meeting-id <meeting-id...>",
      "One or more meeting ids to delete",
    )
    .requiredOption(
      "--staff-email <email>",
      "Email of the staff member who owns the meetings; the delete only matches their meetings",
    )
    .option(
      "--commit",
      "End the transaction with COMMIT instead of ROLLBACK (default is a dry run)",
      false,
    )
    .parse();

  const { meetingId, staffEmail, commit } = program.opts();

  let sql: ReturnType<typeof buildDeleteMeetingSql>;
  try {
    sql = buildDeleteMeetingSql({ meetingIds: meetingId, staffEmail, commit });
  } catch (error) {
    return program.error(
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log(`-- ===== 1. Inspect (read-only) =====

${sql.inspect}

-- ===== 2. Delete (${commit ? "COMMIT: this is permanent" : "dry run: ends in ROLLBACK"}) =====
${commit ? "" : "-- Once the counts look right, re-run this script with --commit.\n"}
${sql.transaction}`);
}

main();
