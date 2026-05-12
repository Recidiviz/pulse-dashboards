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

import {
  LookerEmbedCookielessSessionData,
  LookerEmbedCookielessTokenData,
} from "@looker/embed-sdk";
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

  async postExternalRequest(
    stateCode: string,
    requestType: string,
    body: Record<string, unknown>,
  ): Promise<any> {
    return this.client.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${stateCode}/${requestType}`,
      body,
    );
  }

  async optimizeRoute(body: {
    origin: string;
    destination?: string;
    waypoints: Array<{
      pseudonymizedId: string;
      placeId: string;
      formattedAddress: string | undefined;
    }>;
  }): Promise<{
    optimizedOrder: string[];
    isChanged: boolean;
  }> {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    const response = await this.client.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${stateCode}/optimize_route`,
      body,
    );
    return response.data;
  }

  // NB: These Looker endpoints hit the Node staff-server backend, not the Python case-triage backend
  async getLookerConfig(): Promise<{ host: string; model: string }> {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    const res = await this.client.get(
      `${import.meta.env.VITE_API_URL}/api/${stateCode}/looker/config`,
    );
    return res.data;
  }

  async acquireLookerSession(): Promise<
    LookerEmbedCookielessSessionData & { session_id: string }
  > {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    const res = await this.client.get(
      `${import.meta.env.VITE_API_URL}/api/${stateCode}/looker/acquireSession`,
    );
    return res.data;
  }

  async generateLookerTokens(
    body: LookerEmbedCookielessTokenData & { session_id: string | null },
  ): Promise<LookerEmbedCookielessSessionData> {
    const stateCode = this.userStore.isRecidivizUser
      ? this.userStore.rootStore?.currentTenantId
      : this.userStore.stateCode;
    const res = await this.client.post(
      `${import.meta.env.VITE_API_URL}/api/${stateCode}/looker/generateTokens`,
      body,
    );
    return res.data;
  }
}
