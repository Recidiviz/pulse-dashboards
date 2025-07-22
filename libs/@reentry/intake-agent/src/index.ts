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

import { type Sections } from "~@reentry/intake-agent/constants";
import { builder } from "~@reentry/intake-agent/graph";

export { getLangraphCheckpointerForStateCode } from "~@reentry/intake-agent/get-checkpointer";

type AgentStatus =
  | "not_initialized"
  | "waiting_for_response"
  | "completed"
  | "error";

export class IntakeAgent {
  graph;
  threadId;
  // Current status of the conversation with the agent.
  status: AgentStatus = "not_initialized";

  constructor(opts: {
    checkpointer: BaseCheckpointSaver;
    clientName: string;
    intakeId: string;
    sections: Sections;
  }) {
    this.graph = builder.compile({ checkpointer: opts.checkpointer });
    this.threadId = opts.intakeId;

    this.graph.updateState(
      {
        configurable: {
          thread_id: this.threadId,
        },
      },
      {
        clientName: opts.clientName,
        sections: opts.sections,
      },
    );
  }

  async processStream(
    graphStream: Awaited<ReturnType<typeof this.graph.stream>>,
  ) {
    const messages: AIMessage[] = [];
    let lastNode;

    for await (const chunk of graphStream) {
      for (const [node, values] of Object.entries(chunk)) {
        if (values.messages) {
          const messagesArray = Array.isArray(values.messages)
            ? values.messages
            : [values.messages];

          for (const message of messagesArray) {
            if (message instanceof AIMessage) {
              messages.push(message);
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

  /**
   * Initialize the agent and starts the conversation.'
   *
   * If a message id is provided, it will return all of the AI messages from that point onwards.
   * If no message id is provided, it will stream the next messages from the agent.
   *
   * @param lastMessageId - Optional message id to start from.
   * @returns list of AI messages
   */
  async init(lastMessageId?: string | null) {
    if (this.status !== "not_initialized") {
      throw new Error("Agent has already been started.");
    }

    // If a message id was provided, just return all of the AI messages from that point onwards. Otherwise, fetch the next messages.
    if (lastMessageId) {
      const state = await this.graph.getState({
        configurable: {
          thread_id: this.threadId,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const messages = state.values.messages;
      // TODO: process this to return only the messages after the lastMessageId
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
    if (this.status === "not_initialized") {
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
