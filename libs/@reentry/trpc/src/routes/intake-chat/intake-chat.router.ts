// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck Need to fix typing in followup

import { AIMessage } from "@langchain/core/messages";
import { tracked, TRPCError } from "@trpc/server";
import EventEmitter, { on } from "events";

import {
  getLangraphCheckpointerForStateCode,
  IntakeAgent,
} from "~@reentry/intake-agent";
import { sectionsSchema } from "~@reentry/intake-agent/constants";
import { router, t } from "~@reentry/trpc/init";
import {
  intakeChatInputSchema,
  intakeChatResponseInputSchema,
} from "~@reentry/trpc/routes/intake-chat/intake-chat.schema";

type EmitData =
  | {
      type: "loading";
    }
  | {
      type: "response";
      lastId?: string;
      messages?: string[];
    };

// TODO: replace this with a redis subscription so it's monitored across multiple instances
const ee = new EventEmitter();
const intakeAgents: Record<string, IntakeAgent> = {};

function convertAIMessagesToStringsAndGetLastId(aiMessages: AIMessage[]) {
  const messages = aiMessages.map((message) => message.content as string);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lastId = aiMessages[aiMessages.length - 1].id!;
  return { messages, lastId };
}

export const intakeChatRouter = router({
  reply: t.procedure
    .input(intakeChatResponseInputSchema)
    .mutation(async ({ input: { intakeId, response } }) => {
      const agent = intakeAgents[intakeId];
      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `There is no active chat for that intake. Cannot process response for intake with id ${intakeId}`,
        });
      }

      ee.emit(`response[${intakeId}]`, {
        type: "loading",
      });

      const { messages, lastId } = convertAIMessagesToStringsAndGetLastId(
        await agent.processResponse(response),
      );

      ee.emit(`response[${intakeId}]`, {
        type: "response",
        lastId,
        messages,
      } satisfies EmitData);
    }),
  intakeChat: t.procedure
    .input(intakeChatInputSchema)
    .subscription(async function* ({
      ctx: { prisma },
      input: { intakeId, lastEventId },
      signal,
    }) {
      const intake = await prisma.intake.findUniqueOrThrow({
        where: { id: intakeId },
        include: {
          client: {
            select: {
              givenNames: true,
              surname: true,
            },
          },
        },
      });

      const clientName = `${intake.client.givenNames} ${intake.client.surname}`;
      const sections = sectionsSchema.parse(intake.sections);

      if (!intakeAgents[intakeId]) {
        intakeAgents[intakeId] = new IntakeAgent({
          checkpointer: getLangraphCheckpointerForStateCode("US_ID"),
          clientName,
          intakeId,
          sections: sections,
        });
      } else {
        throw new TRPCError({
          code: "CONFLICT",
          message: `There is already an active chat for intake with id ${intakeId}`,
        });
      }

      const agent = intakeAgents[intakeId];

      try {
        // Initialize the agent.
        // If this is a completely new connection, it will start the agent as if it were a new chat.
        // If the client is reconnecting, it will return the messages that have come from the last event id.
        const { messages, lastId } = convertAIMessagesToStringsAndGetLastId(
          await agent.init(lastEventId),
        );
        yield tracked(lastId, messages);

        // listen for new events
        for await (const data of on(ee, `response[${intakeId}]`, {
          // Passing the AbortSignal from the request automatically cancels the event emitter when the subscription is aborted
          signal,
        })) {
          const typedData = data as EmitData;
          if (typedData.type === "loading") {
            yield tracked("loading", { type: "loading" });
          } else if (typedData.type === "response") {
            yield tracked(typedData.lastId, {
              type: "response",
              messages: typedData.messages,
            });
          }
        }
      } finally {
        // cleanup when the subscription is closed, for any reason
        // See https://trpc.io/docs/server/subscriptions#cleanup-of-side-effects for why this works
        delete intakeAgents[intakeId];
      }
    }),
});
