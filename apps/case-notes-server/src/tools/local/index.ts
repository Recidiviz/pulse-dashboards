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

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import inquirer from "inquirer";
import superjson from "superjson";

import { AppRouter } from "~@case-notes-server/trpc";
import { buildServer } from "~case-notes-server/server";

export const testPort = process.env["PORT"]
  ? Number(process.env["PORT"])
  : 3003;
export const testHost = process.env["HOST"] ?? "localhost";

async function main() {
  const stateCode = process.argv[2];
  const query = process.argv[3];

  if (!stateCode || !query) {
    throw Error("Missing required state code of query");
  }

  const server = buildServer();

  // Override he jwtVerify function to always pass
  server.addHook("preHandler", (req, reply, done) => {
    req.jwtVerify = async () => {
      return "";
    };
    done();
  });

  // Start listening.
  server.listen({ port: testPort, host: testHost }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });

  const trpcClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
        headers() {
          return {
            // This doesn't matter because the preHandler override always skips auth on this local server
            Authorization: `Bearer test-token`,
            StateCode: stateCode,
          };
        },
      }),
    ],
    // Required to get Date objects to serialize correctly.
    transformer: superjson,
  });

  const initialResults = await trpcClient.search.query({
    query,
  });

  console.log(initialResults.results);

  let nextPageToken = initialResults.nextPageToken;
  let keepSearching = true;

  while (keepSearching) {
    const { response } = await inquirer.prompt({
      type: "confirm",
      name: "response",
      message: "Want to get the next page of results?",
      default: "Yes",
    });

    keepSearching = response;

    if (keepSearching) {
      const nextResults = await trpcClient.search.query({
        query,
        pageToken: nextPageToken ?? undefined,
      });
      console.log(nextResults.results);
      nextPageToken = nextResults.nextPageToken;
    }
  }

  server.close();
}

main();
