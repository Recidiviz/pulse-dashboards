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

import { runInAction, when } from "mobx";

import UserStore from "./UserStore";

interface RequestProps {
  path: string;
  method: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  retrying?: boolean;
}

class API {
  userStore: UserStore;

  isSessionInitialized: boolean;

  csrfToken: string;

  constructor(userStore: UserStore) {
    this.userStore = userStore;
    this.isSessionInitialized = false;
    this.csrfToken = "";

    when(
      () => userStore.isAuthorized,
      () => this.initializeSession()
    );
  }

  async initializeSession(): Promise<void | string> {
    try {
      const response = (await this.get(
        `/workflows/${this.userStore.stateCode}/init`
      )) as Response;
      const { csrf } = await response.json();

      runInAction(() => {
        if (csrf !== "") this.csrfToken = csrf;
        this.isSessionInitialized = true;
      });
    } catch (error) {
      if (error instanceof Error) return error.message;
      return String(error);
    }
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
      "X-CSRF-Token": this.csrfToken,
      "Content-Type": "application/json",
    };

    const response = await fetch(path, {
      body: method !== "GET" ? JSON.stringify(body) : null,
      method,
      headers,
    });

    const json = await response.json();

    if (json.status === 400 && json.code === "invalid_csrf_token") {
      await this.initializeSession();
      if (!retrying) {
        return this.request({ path, method, body, retrying: true });
      }
    }

    if (!response.ok) {
      throw new Error(
        `API request failed.\n
            Status: ${json.status} - ${json.statusText}\n
            Errors: ${JSON.stringify(json.errors)}`
      );
    }

    return json;
  }

  async get(
    path: string,
    body: Record<string, string> = {}
  ): Promise<Body | Response | string> {
    return this.request({ path, body, method: "GET" });
  }

  async post(
    path: string,
    body: Record<string, string> = {}
  ): Promise<Body | Response | string> {
    return this.request({ path, body, method: "POST" });
  }
}

export default API;
