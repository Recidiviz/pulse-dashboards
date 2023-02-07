// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import UserStore from "./UserStore";

interface RequestProps {
  path: string;
  method: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  retrying?: boolean;
}

class API {
  userStore: UserStore;

  constructor(userStore: UserStore) {
    this.userStore = userStore;
  }

  async request({
    path,
    method,
    body,
    retrying = false,
  }: RequestProps): Promise<Body | Response | string> {
    if (!this.userStore.getToken) {
      return Promise.reject();
    }

    const token = await this.userStore.getToken();

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(path, {
      body: method !== "GET" ? JSON.stringify(body) : null,
      method,
      headers,
    });

    // Clone response in order to read json here but still return Response obj (and use .json() there)
    const json = await response.clone().json();

    if (!response.ok) {
      throw new Error(
        `API request failed.\n
            Status: ${json.status} - ${json.statusText}\n
            Errors: ${JSON.stringify(json.errors)}`
      );
    }
    return response;
  }

  async get(
    path: string,
    body: Record<string, string> = {}
  ): Promise<Body | Response | string> {
    return this.request({ path, body, method: "GET" });
  }

  async post(
    path: string,
    body: Record<string, unknown> = {}
  ): Promise<Body | Response | string> {
    return this.request({ path, body, method: "POST" });
  }
}

export default API;
