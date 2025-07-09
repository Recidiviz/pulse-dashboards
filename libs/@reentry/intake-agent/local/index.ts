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

/* eslint-disable no-await-in-loop */

import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import inquirer from "inquirer";

import { IntakeAgent } from "~@reentry/intake-agent/index";

async function main() {
  const { checkpointerOption } = await inquirer.prompt({
    type: "list",
    choices: ["memory", "postgres"],
    name: "checkpointerOption",
    message: "Which checkpointer do you want to use?",
    default: "memory",
  });

  let checkpointer;

  if (checkpointerOption === "postgres") {
    checkpointer = PostgresSaver.fromConnString(
      process.env["LANGGRAPH_CHECKPOINTER_DB_CONNECTION_STRING"] ?? "",
    );
    await checkpointer.setup();
  } else {
    checkpointer = new MemorySaver();
  }

  const { name } = await inquirer.prompt({
    name: "name",
    message: "What's your name?",
  });

  const agent = new IntakeAgent(checkpointer, name);

  const initialMessages = await agent.start();

  for (const message of initialMessages) {
    console.log(message);
    console.log("\n");
  }

  let status = agent.getStatus();

  while (status === "waiting_for_response") {
    const { response } = await inquirer.prompt([
      {
        type: "input",
        name: "response",
        message: "",
      },
    ]);

    const messages = await agent.processResponse(response);
    for (const message of messages) {
      console.log(message);
      console.log("\n");
    }
    status = agent.getStatus();
  }
}

main();
