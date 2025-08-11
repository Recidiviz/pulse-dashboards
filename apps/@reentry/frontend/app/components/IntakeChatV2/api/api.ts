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

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import {
  AuthVerificationResponse,
  IntakeFields,
  IntakeResponse,
} from "~@reentry/frontend/components/IntakeChatV2/types";

const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] || "";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";
interface RequestOptions {
  method?: ApiMethod;
  body?: unknown;
}

/**
 * Base API caller using axios
 */
export async function apiRequest<T>(
  endpoint: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method,
    data: body,
  };

  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * Gets token after validating required intake fields
 */
export function getIntakeToken(fields: IntakeFields): Promise<IntakeResponse> {
  const { firstName, lastName, month, day, year, stateCode } = fields;
  const dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const payload = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    date_of_birth: dob,
    state_code: stateCode,
  };

  return apiRequest<IntakeResponse>("/get-intake-token", {
    method: "POST",
    body: payload,
  });
}

/**
 * Calls GET /verify-auth to verify the HTTP‐only token cookie
 */
export function verifyAuthToken(): Promise<AuthVerificationResponse> {
  return apiRequest<AuthVerificationResponse>("/verify-auth", {
    method: "GET",
  });
}
