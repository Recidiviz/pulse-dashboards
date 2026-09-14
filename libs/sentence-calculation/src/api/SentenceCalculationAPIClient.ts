// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { CalculatorResponse, calculatorResponseSchema } from "~datatypes";

import { SentenceCalculationHost } from "../types";

/**
 * Minimal client for the Sentence Calculation endpoints on the Case Triage
 * backend. Builds its own requests from the host's auth token rather than
 * borrowing the staff app's `APIStore`, which lives outside this library.
 */
export class SentenceCalculationAPIClient {
  constructor(private readonly host: SentenceCalculationHost) {}

  private get baseUrl(): string {
    const { currentTenantId } = this.host;
    if (!currentTenantId) {
      throw new Error(
        "Attempted to call the Sentence Calculation API with no tenant selected",
      );
    }
    return `${import.meta.env["VITE_NEW_BACKEND_API_URL"]}/sentence_calculation/${currentTenantId}`;
  }

  private async authHeaders(): Promise<HeadersInit> {
    const token = await this.host.userStore.getToken?.();
    if (!token) {
      throw new Error("Unable to retrieve an auth token for the current user");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Round-trips a string through the backend, which echoes it back along with
   * the state code it authorized the request for. Exists to verify the
   * frontend/API/auth path end to end; it has no product behavior.
   */
  async echo(value: string): Promise<CalculatorResponse> {
    const response = await fetch(`${this.baseUrl}/echo`, {
      method: "POST",
      headers: await this.authHeaders(),
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error(
        `Sentence Calculation echo request failed with status ${response.status}`,
      );
    }

    return calculatorResponseSchema.parse(await response.json());
  }
}
