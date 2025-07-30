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

import { AIMessage } from "@langchain/core/messages";
import { tracked, TRPCError } from "@trpc/server";
import EventEmitter, { on } from "events";

import { IntakeAgent } from "~@reentry/intake-agent";
import { sectionsSchema } from "~@reentry/intake-agent/constants";
import { getLangraphCheckpointerForStateCode } from "~@reentry/intake-agent/get-checkpointer";
import { router, t } from "~@reentry/trpc/init";
import {
  intakeChatInputSchema,
  intakeChatResponseInputSchema,
} from "~@reentry/trpc/routes/intake-chat/intake-chat.schema";
import { EmitData } from "~@reentry/trpc/routes/intake-chat/types";

// TODO: replace these with redis subscriptions so they are monitored across multiple instances
const ee = new EventEmitter();
const intakeAgentsAndStatuses: Record<
  string,
  {
    agent: IntakeAgent;
    hasActiveSubscription: boolean;
    isProcessingResponse: boolean;
  }
> = {};

function convertAIMessagesToStringsAndGetLastId(aiMessages: AIMessage[]) {
  const messages = aiMessages.map((message) => message.content as string);

  if (aiMessages.length === 0) {
    return { messages, lastId: "none" };
  }

  const lastId = aiMessages[aiMessages.length - 1].id ?? "none";
  return { messages, lastId };
}

export const intakeChatRouter = router({
  reply: t.procedure
    .input(intakeChatResponseInputSchema)
    .mutation(async ({ input: { intakeId, response } }) => {
      const agent = intakeAgentsAndStatuses[intakeId].agent;

      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `There is no active chat for that intake. Cannot process response for intake with id ${intakeId}`,
        });
      }

      ee.emit(`response[${intakeId}]`, {
        type: "loading",
      });

      intakeAgentsAndStatuses[intakeId].isProcessingResponse = true;

      const { messages, lastId } = convertAIMessagesToStringsAndGetLastId(
        await agent.processResponse(response),
      );

      // If there is still an active subscription, set processingResponse to false
      // Otherwise, delete the agent because it is no longer being used anywhere
      if (!intakeAgentsAndStatuses[intakeId].hasActiveSubscription) {
        intakeAgentsAndStatuses[intakeId].isProcessingResponse = false;
      } else {
        delete intakeAgentsAndStatuses[intakeId];
      }

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

      // 1. If there is no agent, make a new one
      // 2. If the agent is already subscribed, throw an error
      // 3. If there is an agent but it is not subscribed, set it to subscribed
      if (!intakeAgentsAndStatuses[intakeId]) {
        intakeAgentsAndStatuses[intakeId] = {
          agent: new IntakeAgent({
            checkpointer: getLangraphCheckpointerForStateCode("US_ID"),
            clientName,
            intakeId,
            sections: sections,
          }),
          hasActiveSubscription: false,
          isProcessingResponse: false,
        };
      } else if (intakeAgentsAndStatuses[intakeId].hasActiveSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `There is already an active chat for intake with id ${intakeId}`,
        });
      } else {
        intakeAgentsAndStatuses[intakeId].hasActiveSubscription = true;
      }

      const agent = intakeAgentsAndStatuses[intakeId].agent;

      try {
        // Initialize the agent.
        // If this is a completely new connection, it will start the agent as if it were a new chat.
        // If the client is reconnecting, it will return the messages that have come after the last event id.
        yield lastEventId
          ? tracked(lastEventId, { type: "loading" })
          : { type: "loading" };

        // If the server is still processing the last response, we do nothing
        if (!intakeAgentsAndStatuses[intakeId].isProcessingResponse) {
          const { messages, lastId } = convertAIMessagesToStringsAndGetLastId(
            await agent.init(lastEventId),
          );

          yield tracked(lastId, {
            type: "response",
            messages: messages,
          });
        }

        // listen for new events
        for await (const [data] of on(ee, `response[${intakeId}]`, {
          // Passing the AbortSignal from the request automatically cancels the event emitter when the subscription is aborted
          signal,
        })) {
          const typedData = data as EmitData;

          if (typedData.type === "loading") {
            yield lastEventId
              ? tracked(lastEventId, { type: "loading" })
              : { type: "loading" };
          } else if (typedData.type === "response") {
            yield tracked(typedData.lastId, {
              type: "response",
              messages: typedData.messages,
            });
          }
        }
      } finally {
        // cleanup when the subscription is closed
        // If the agent is still processing a response, we do not delete it, but we set hasActiveSubscription to false
        // Otherwise, we delete the agent because it is no longer being used anywhere
        // See https://trpc.io/docs/server/subscriptions#cleanup-of-side-effects for why this works
        if (intakeAgentsAndStatuses[intakeId].isProcessingResponse) {
          intakeAgentsAndStatuses[intakeId].hasActiveSubscription = false;
        } else {
          delete intakeAgentsAndStatuses[intakeId];
        }
      }
    }),
});
