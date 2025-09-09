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

import { FastifyRequest } from "fastify";

import { Intake } from "~@reentry/prisma/client";

export async function fetchProcessingStatus(
  req: FastifyRequest,
  clientIds: string[],
): Promise<Record<string, string>> {
  const auth = req.headers.authorization ?? "";
  const res = await fetch(`${process.env["V0_API_URL"]}/processing-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({ client_ids: clientIds }),
  });
  return res.ok ? ((await res.json()) as Record<string, string>) : {};
}

export function resolveIntakeStatus(
  client: { pseudonymizedId: string; intakeEnabled: boolean; Intake: Intake[] },
  processingStatusMap: Record<string, string>,
): "new" | "intake_enabled" | "intake_in_progress" | string {
  const id = client.pseudonymizedId;
  const processingStatus = processingStatusMap[id];

  if (processingStatus === "unknown" || processingStatus === "not_started") {
    const latestIntake = client.Intake[client.Intake.length - 1];

    if (latestIntake) {
      return "intake_in_progress";
    }
    if (client.intakeEnabled) {
      return "intake_enabled";
    }
    return "new";
  }
  return processingStatus;
}
