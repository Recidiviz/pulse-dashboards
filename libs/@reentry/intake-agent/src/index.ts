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

import { AIMessage } from "@langchain/core/messages";
import { BaseCheckpointSaver, Command } from "@langchain/langgraph";

import { builder } from "~@reentry/intake-agent/graph";

type AgentStatus =
  | "not_started"
  | "waiting_for_response"
  | "completed"
  | "error";

export class IntakeAgent {
  graph;
  threadId;
  // Current status of the conversation with the agent.
  status: AgentStatus = "not_started";

  constructor(checkpointer: BaseCheckpointSaver, clientName: string) {
    this.graph = builder.compile({ checkpointer });
    this.threadId = clientName;
    this.graph.updateState(
      {
        configurable: {
          thread_id: clientName,
        },
      },
      {
        clientName: clientName,
      },
    );
  }

  async processStream(
    graphStream: Awaited<ReturnType<typeof this.graph.stream>>,
  ) {
    const messages: string[] = [];
    let lastNode;

    for await (const chunk of graphStream) {
      for (const [node, values] of Object.entries(chunk)) {
        if (values.messages) {
          const messagesArray = Array.isArray(values.messages)
            ? values.messages
            : [values.messages];

          for (const message of messagesArray) {
            if (message instanceof AIMessage) {
              messages.push(message.content as string);
            }
          }
        }
        lastNode = node;
      }
    }

    if (lastNode === "end_chat" || lastNode === "closing_remarks") {
      this.status = "completed";
    } else if (lastNode === "__interrupt__") {
      this.status = "waiting_for_response";
    } else {
      this.status = "error";
      throw new Error(`Unexpected node: ${lastNode}`);
    }

    return messages;
  }

  async start() {
    if (this.status !== "not_started") {
      throw new Error("Agent has already been started.");
    }

    const graphStream = await this.graph.stream(
      {},
      {
        configurable: {
          thread_id: this.threadId,
        },
        streamMode: "updates",
      },
    );

    return await this.processStream(graphStream);
  }

  async processResponse(response: string) {
    if (this.status === "not_started") {
      throw new Error("Agent has not been started. Call start() first.");
    }

    if (this.status === "completed") {
      throw new Error("Agent has already completed its run.");
    }

    const graphStream = await this.graph.stream(
      new Command({ resume: response }),
      {
        configurable: {
          thread_id: this.threadId,
        },
        streamMode: "updates",
      },
    );

    return await this.processStream(graphStream);
  }

  getStatus() {
    return this.status;
  }
}
