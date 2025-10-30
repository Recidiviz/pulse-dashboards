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

import { BaseMessage } from "@langchain/core/messages";
import { FastifyRequest } from "fastify";

import type { AgentStatus } from "~@reentry/intake-agent/types";
import {
  AddressSubmission,
  Status,
} from "~@reentry/trpc/routes/intake-chat/types";

function getApiURL(): string | undefined {
  return process.env["V0_API_URL"];
}

export function agentStatusToSubscriptionStatus(
  agentStatus: AgentStatus,
): Status {
  if (agentStatus === "complete") {
    return "complete";
  } else if (agentStatus === "user_ended") {
    return "user_ended";
  }

  return "active";
}

export async function startAssessmentAndActionPlanGeneration(
  req: FastifyRequest,
  messages: BaseMessage[],
  clientAddress?: AddressSubmission,
): Promise<unknown | { error: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { error: "Missing Authorization header" };
  }

  const apiURL = getApiURL();
  if (!apiURL) {
    return { error: "Missing V0 api URL environment variable" };
  }

  if (!clientAddress) {
    return { error: "Client address is required to start assessment" };
  }

  const body = {
    messages: messages.map((m: BaseMessage) => ({
      role: m.getType?.() === "ai" ? "caseworker" : "client",
      content: m.content,
    })),
    address: clientAddress,
  };

  try {
    const res = await fetch(
      `${apiURL}/intake/client/start-assessment-action-plan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (!res.ok) {
      const details =
        typeof data === "object" && data && "detail" in data
          ? data.detail
          : undefined;
      return {
        error: `There was an issue starting the assessment: (${res.status}) ${details}`,
      };
    }

    return data;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function parseAddress(
  address: string | null | undefined,
): AddressSubmission | undefined {
  if (!address) {
    return;
  }

  const parts = address.split(",").map((part) => part.trim());

  if (parts.length < 2) {
    throw new Error(
      `Invalid address format. Expected at least 2 parts (city, state), got ${parts.length}.`,
    );
  }

  // Parse from the end: last is state, second-to-last is city
  const state = parts[parts.length - 1];
  const city = parts[parts.length - 2];

  // Everything before city is street_address (joined back with commas)
  const street_address =
    parts.length > 2 ? parts.slice(0, -2).join(", ") : undefined;

  return street_address
    ? { street_address, city, state }
    : { city, state };
}
