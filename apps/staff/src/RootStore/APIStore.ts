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
import dedent from "dedent";

import UserStore from "./UserStore";

interface RequestProps {
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  retrying?: boolean;
}

type ExternalSMSMessageRequest = {
  recipientExternalId: string;
  recipientPhoneNumber: string;
  senderId: string;
  message: string;
  userHash: string;
};

export class APIStore {
  userStore: UserStore;

  constructor(userStore: UserStore) {
    this.userStore = userStore;
  }

  async request({
    path,
    method,
    body,
    retrying = false,
  }: RequestProps): Promise<any> {
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

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        dedent`API request failed.
            Status: ${response.status} - ${response.statusText}
            Errors: ${JSON.stringify(json.errors ?? json)}`,
      );
    }
    return json;
  }

  async get(path: string, body: Record<string, string> = {}): Promise<any> {
    return this.request({ path, body, method: "GET" });
  }

  async post(path: string, body: Record<string, unknown> = {}): Promise<any> {
    return this.request({ path, body, method: "POST" });
  }

  async patch(path: string, body: Record<string, unknown> = {}): Promise<any> {
    return this.request({ path, body, method: "PATCH" });
  }

  async postExternalSMSMessage(body: ExternalSMSMessageRequest): Promise<any> {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    return this.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${stateCode}/enqueue_sms_request`,
      body,
    );
  }
}
