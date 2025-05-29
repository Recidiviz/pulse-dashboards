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

import axios, { AxiosInstance } from "axios";

import UserStore from "./UserStore";

export class APIStore {
  userStore: UserStore;
  client: AxiosInstance;

  constructor(userStore: UserStore) {
    this.userStore = userStore;
    this.client = axios.create({
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.client.interceptors.request.use(async (config) => {
      if (!this.userStore.getToken) return Promise.reject();
      const token = await this.userStore.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async postExternalSMSMessage(body: {
    recipientExternalId: string;
    recipientPhoneNumber: string;
    senderId: string;
    message: string;
    userHash: string;
  }): Promise<any> {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    return this.client.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${stateCode}/enqueue_sms_request`,
      body,
    );
  }
}
