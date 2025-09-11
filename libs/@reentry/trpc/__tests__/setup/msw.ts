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

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { testPrismaClient } from "~@reentry/trpc/test/setup";

export function processingStatusHandler(status = "unknown") {
  return http.post("*/clients/processing-status", async ({ request }) => {
    const body = (await request.json()) as {
      staff_pseudo_id?: string;
    };

    const staffPseudoId = body.staff_pseudo_id;
    let clientIds: string[] | undefined;

    try {
      const clients = await testPrismaClient.client.findMany({
        where: {
          staff: {
            some: {
              staff: { pseudonymizedId: staffPseudoId },
            },
          },
        },
        select: { pseudonymizedId: true },
      });
      clientIds = clients.map((c) => c.pseudonymizedId);
    } catch {
      clientIds = [];
    }

    clientIds = clientIds ?? [];
    const clientToStatusMap: Record<string, string> = {};

    for (const id of clientIds) {
      clientToStatusMap[id] = status;
    }

    return HttpResponse.json(clientToStatusMap);
  });
}

export const mswServer = setupServer(
  // Default processing-status handler returning 'unknown' for all ids.
  processingStatusHandler("unknown"),
);
