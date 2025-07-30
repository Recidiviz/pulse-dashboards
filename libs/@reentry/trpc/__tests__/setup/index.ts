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

import { generateMock } from "@anatine/zod-mock";
import ws from "@fastify/websocket";
import { RunnableLambda } from "@langchain/core/runnables";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { MemorySaver } from "@langchain/langgraph";
import { init } from "@sentry/node";
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  TRPCClient,
  wsLink,
} from "@trpc/client";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { FastifyInstance } from "fastify/types/instance";
import sentryTestkit from "sentry-testkit";
import superjson from "superjson";
import { beforeAll, beforeEach } from "vitest";

import { getPrismaClientForStateCode } from "~@reentry/prisma";
import { StateCode } from "~@reentry/prisma/client";
import { createContext } from "~@reentry/trpc/context";
import { AppRouter, appRouter } from "~@reentry/trpc/router";
import { seed } from "~@reentry/trpc/test/setup/seed";
import { resetDb } from "~@reentry/trpc/test/setup/utils";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

export let testTRPCClient: TRPCClient<AppRouter>;
export let testServer: FastifyInstance;
export const testPrismaClient = getPrismaClientForStateCode(StateCode.US_ID);

const { testkit, sentryTransport } = sentryTestkit();

export { testkit };

vi.mock("@langchain/openai", () => {
  const fakeModel = vi.fn().mockImplementation(() => {
    const chat = new FakeListChatModel({
      responses: ["Welcome message"],
    });

    chat.withStructuredOutput = vi.fn().mockImplementation((schema) => {
      return RunnableLambda.from(async () => {
        return generateMock(schema, {
          mockeryMapper: (keyName: string) => {
            if (keyName === "isSectionComplete" || keyName === "needsHelp") {
              return () => false;
            }

            if (keyName === "response") {
              return () => "question";
            }

            return undefined;
          },
        });
      });
    });

    return chat;
  });

  return {
    ChatOpenAI: fakeModel,
  };
});

/**
 * Ephemeral MemorySaver used to save the state of the LangGraph to enable us
 * to initialize a brand new chat session every time we run the tests.
 */
export let sharedMemorySaver = new MemorySaver();
vi.mock("~@reentry/intake-agent/get-checkpointer", () => ({
  getLangraphCheckpointerForStateCode: () => sharedMemorySaver,
}));

export const initWSClient = () => {
  return createWSClient({
    url: `ws://${testHost}:${testPort}/trpc`,
    connectionParams: () => {
      return {
        statecode: "US_ID",
      };
    },
  });
};

export let wsClient: ReturnType<typeof initWSClient>;

export const initTRPCClient = () => {
  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition(op) {
          return op.type === "subscription";
        },
        true: wsLink({ client: wsClient, transformer: superjson }),
        false: httpBatchLink({
          url: `http://${testHost}:${testPort}/trpc`,
          headers() {
            return {
              StateCode: "US_ID",
            };
          },
          transformer: superjson,
        }),
      }),
    ],
  });
};

export const initTestServer = async () => {
  testServer = Fastify({
    logger: true,
  });

  testServer.register(ws);

  testServer.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    useWSS: true,
    trpcOptions: {
      router: appRouter,
      createContext: createContext,
      onError({ path, error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    } satisfies FastifyTRPCPluginOptions<typeof appRouter>["trpcOptions"],
  });

  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}/trpc`);
    }
  });
};

beforeAll(async () => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
  });

  await initTestServer();
  wsClient = initWSClient();
  testTRPCClient = initTRPCClient();
});

beforeEach(async () => {
  await resetDb(testPrismaClient);
  await seed(testPrismaClient);
  sharedMemorySaver = new MemorySaver();

  testkit.reset();
});
