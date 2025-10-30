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
import { getIntakeCheckpointerForStateCode } from "~@reentry/intake-agent/get-checkpointer";
import { getIntakeConfigForState } from "~@reentry/intake-agent/intake_configs/utils";
import { Prisma } from "~@reentry/prisma/client";
import { regularJwtProcedure, router } from "~@reentry/trpc/init";
import { INTAKE_GET_ARGS } from "~@reentry/trpc/routes/intake-chat/constants";
import {
  createOrGetInputSchema,
  intakeChatInputSchema,
  intakeChatResponseInputSchema,
  setEndDateInputSchema,
} from "~@reentry/trpc/routes/intake-chat/intake-chat.schema";
import {
  EmitData,
  MessagesLastId,
} from "~@reentry/trpc/routes/intake-chat/types";
import { agentStatusToSubscriptionStatus } from "~@reentry/trpc/routes/intake-chat/utils";

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

function getCleanedMessagesAndLastId(aiMessages: AIMessage[]): MessagesLastId {
  const messages = aiMessages.map((message) => ({
    content: message.content as string,
    section: message.response_metadata["section"],
    id: message.id,
    from_role: "caseworker",
    role: "caseworker",
  }));

  if (aiMessages.length === 0) {
    return { messages: messages, lastId: "none" };
  }

  const lastId = messages[messages.length - 1].id ?? "none";
  return { messages: messages, lastId };
}

export const intakeChatRouter = router({
  getIntake: regularJwtProcedure
    .input(createOrGetInputSchema)
    .query(async ({ ctx: { prisma }, input: { clientPseudoId } }) => {
      const existingIntake = await prisma.intake.findFirst({
        where: {
          client: {
            pseudonymizedId: clientPseudoId,
          },
        },
        select: INTAKE_GET_ARGS,
      });

      if (!existingIntake) {
        return null;
      }

      return existingIntake;
    }),
  createIntake: regularJwtProcedure
    .input(createOrGetInputSchema)
    .mutation(
      async ({ ctx: { prisma, stateCode }, input: { clientPseudoId } }) => {
        const existingIntake = await prisma.intake.findFirst({
          where: {
            client: {
              pseudonymizedId: clientPseudoId,
            },
          },
          select: INTAKE_GET_ARGS,
        });

        if (existingIntake) {
          throw new Error("Intake already exists for this client.");
        }

        const intakeConfig = getIntakeConfigForState(stateCode);

        try {
          return await prisma.intake.create({
            data: {
              config: intakeConfig,
              client: {
                connect: {
                  pseudonymizedId: clientPseudoId,
                },
              },
            },
            select: INTAKE_GET_ARGS,
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2025"
          ) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Client with that id was not found",
              cause: e,
            });
          }

          throw e;
        }
      },
    ),
  setEndDate: regularJwtProcedure
    .input(setEndDateInputSchema)
    .mutation(
      async ({ ctx: { prisma, user }, input: { intakeId, endDate } }) => {
        const intake = await prisma.intake.findUnique({
          where: {
            id: intakeId,
            client: { pseudonymizedId: user?.clientPseudoId },
          },
          select: { id: true },
        });

        if (!intake) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No intake found with ID "${intakeId}" for client "${user?.clientPseudoId}"`,
          });
        }

        return await prisma.intake.update({
          where: { id: intakeId },
          data: { endDate },
        });
      },
    ),
  reply: regularJwtProcedure
    .input(intakeChatResponseInputSchema)
    .mutation(
      async ({ ctx: { user, prisma }, input: { intakeId, response } }) => {
        console.log(
          `(intake.reply, ${intakeId}, ${response}) Reply endpoint hit`,
        );

        const intake = await prisma.intake.findUnique({
          where: {
            id: intakeId,
            client: {
              pseudonymizedId: user?.clientPseudoId,
            },
          },
        });

        if (!intake) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No intake found with ID "${intakeId}" for client "${user?.clientPseudoId}"`,
          });
        }
        console.log(
          `(intake.reply, ${intakeId}, ${response}) Successfully verified intake exists`,
        );

        const intakeAgentAndStatus = intakeAgentsAndStatuses[intakeId];

        if (!intakeAgentAndStatus) {
          console.log(
            `(intake.reply, ${intakeId}, ${response}) No intake status/agent found. Throwing error.`,
          );

          throw new TRPCError({
            code: "NOT_FOUND",
            message: `There is no active chat for that intake. Cannot process response for intake with id ${intakeId}`,
          });
        }

        console.log(
          `(intake.reply, ${intakeId}, ${response}) Intake agent and status found: ${JSON.stringify(
            intakeAgentAndStatus,
          )}`,
        );

        const agent = intakeAgentAndStatus.agent;

        console.log(
          `(intake.reply, ${intakeId}, ${response}) Sending "loading" to event emitter.`,
        );
        ee.emit(`response[${intakeId}]`, {
          type: "loading",
        });
        console.log(
          `(intake.reply, ${intakeId}, ${response}) Sent "loading" to event emitter. Processing response now.`,
        );

        intakeAgentsAndStatuses[intakeId].isProcessingResponse = true;

        const { messages, lastId } = getCleanedMessagesAndLastId(
          await agent.processResponse(response),
        );

        console.log(
          `(intake.reply, ${intakeId}, ${response}) Processed responses from agent: ${messages.map(
            (m) => m.content,
          )}`,
        );

        // If there is still an active subscription, set processingResponse to false
        // Otherwise, delete the agent because it is no longer being used anywhere
        if (intakeAgentsAndStatuses[intakeId].hasActiveSubscription) {
          console.log(
            `(intake.reply, ${intakeId}, ${response}) Has active subscription, setting isProcessingResponse to false.`,
          );
          intakeAgentsAndStatuses[intakeId].isProcessingResponse = false;
        } else {
          console.log(
            `(intake.reply, ${intakeId}, ${response}) No active subscription, deleting agent.`,
          );
          delete intakeAgentsAndStatuses[intakeId];
        }

        console.log(
          `(intake.reply, ${intakeId}, ${response}) Emitting response to event emitter.`,
        );
        ee.emit(`response[${intakeId}]`, {
          type: "response",
          lastId,
          messages,
          status: agentStatusToSubscriptionStatus(agent.getStatus()),
        } satisfies EmitData);
      },
    ),
  chat: regularJwtProcedure
    .input(intakeChatInputSchema)
    .subscription(async function* ({
      ctx: { prisma, user },
      input: { intakeId, lastEventId, stateCode },
      signal,
    }) {
      console.log(
        `(intake.chat, ${intakeId}, ${lastEventId}) Chat subscription started`,
      );

      const intake = await prisma.intake.findUnique({
        where: {
          id: intakeId,
          client: {
            pseudonymizedId: user?.clientPseudoId,
          },
        },
        include: {
          client: {
            select: {
              givenNames: true,
              surname: true,
            },
          },
        },
      });

      if (!intake) {
        console.log(
          `(intake.chat, ${intakeId}, ${lastEventId}) No intake found. Throwing error.`,
        );

        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No intake found with ID "${intakeId}" for client "${user?.clientPseudoId}"`,
        });
      }

      const clientName = `${intake.client.givenNames} ${intake.client.surname}`;

      // 1. If there is no agent, make a new one
      // 2. If the agent is already subscribed, throw an error
      // 3. If there is an agent but it is not subscribed, set it to subscribed
      if (!intakeAgentsAndStatuses[intakeId]) {
        console.log(
          `(intake.chat, ${intakeId}, ${lastEventId}) No status/agent found. Creating new agent.`,
        );

        intakeAgentsAndStatuses[intakeId] = {
          agent: new IntakeAgent({
            checkpointer: getIntakeCheckpointerForStateCode(stateCode),
            clientName,
            intakeId,
            config: intake.config,
          }),
          hasActiveSubscription: true,
          isProcessingResponse: false,
        };
      } else if (intakeAgentsAndStatuses[intakeId].hasActiveSubscription) {
        console.log(
          `(intake.chat, ${intakeId}, ${lastEventId}) There is already an active subscription. Throwing error.`,
        );

        throw new TRPCError({
          code: "CONFLICT",
          message: `There is already an active chat for intake with id ${intakeId}`,
        });
      } else {
        console.log(
          `(intake.chat, ${intakeId}, ${lastEventId}) Agent exists, setting hasActiveSubscription to true.`,
        );

        intakeAgentsAndStatuses[intakeId].hasActiveSubscription = true;
      }

      const agent = intakeAgentsAndStatuses[intakeId].agent;

      try {
        // Initialize the agent.
        // If this is a completely new connection, it will start the agent as if it were a new chat.
        // If the client is reconnecting, it will return the messages that have come after the last event id.
        console.log(
          `(intake.chat, ${intakeId}, ${lastEventId}) Yielding initial loading messages`,
        );

        yield lastEventId
          ? tracked(lastEventId, { type: "loading" })
          : { type: "loading" };

        // If the server is still processing the last response, we do nothing
        if (!intakeAgentsAndStatuses[intakeId].isProcessingResponse) {
          console.log(
            `(intake.chat, ${intakeId}, ${lastEventId}) No response is being processed, initializing agent and yielding messages`,
          );

          const { messages, lastId } = getCleanedMessagesAndLastId(
            await agent.init(lastEventId),
          );

          console.log(
            `(intake.chat, ${intakeId}, ${lastEventId}) Agent initialized, yielding response messages: ${messages.map(
              (m) => m.content,
            )}`,
          );

          yield tracked(lastId, {
            type: "response",
            status: agentStatusToSubscriptionStatus(agent.getStatus()),
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
            console.log(
              `(intake.chat, ${intakeId}, ${lastEventId}) Got "loading" event, yielding...`,
            );

            yield lastEventId
              ? tracked(lastEventId, { type: "loading" })
              : { type: "loading" };
          } else if (typedData.type === "response") {
            console.log(
              `(intake.chat, ${intakeId}, ${lastEventId}) Got "response" event, yielding messages: ${typedData.messages.map(
                (m) => m.content,
              )}`,
            );

            yield tracked(typedData.lastId, {
              type: "response",
              status: typedData.status,
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
          console.log(
            `(intake.chat, ${intakeId}, ${lastEventId}) Subscription closed but response is still being processed. Setting hasActiveSubscription to false.`,
          );

          intakeAgentsAndStatuses[intakeId].hasActiveSubscription = false;
        } else {
          console.log(
            `(intake.chat, ${intakeId}, ${lastEventId}) Subscription closed and response is no longer being processed. Deleting agent.`,
          );

          delete intakeAgentsAndStatuses[intakeId];
        }
      }
    }),
});
