// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Command } from "@commander-js/extra-typings";
import { StateCode } from "@prisma/jii-texting/client";

import { processJiiContactReminders } from "~@jii-texting/processor/scripts/process-jii-contact-reminders";
import { processJiiEligiblityTexts } from "~@jii-texting/processor/scripts/process-jii-eligibility-texts";

// Define CLI
const program = new Command()
  .option("-s, --state-code <code>", "State code to run the Cloud Run job for")
  .option("-d, --dry-run", "Run the script without sending messages")
  .option(
    "-w, --workflow-execution-id <id>",
    "The Workflow execution ID that triggered this script",
  );

function main() {
  program.parse();
  const options = program.opts();

  const args = {
    stateCode: options.stateCode as StateCode,
    dryRun: options.dryRun ? true : false,
    workflowExecutionId: options.workflowExecutionId as string,
  };

  if (options.stateCode === "US_ID") {
    processJiiEligiblityTexts(args);
  }

  if (options.stateCode === "US_TX") {
    processJiiContactReminders(args);
  }
}

main();
