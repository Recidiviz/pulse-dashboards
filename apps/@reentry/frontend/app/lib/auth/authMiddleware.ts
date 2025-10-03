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

import type { Middleware } from "openapi-fetch";

import { globalAuthStore } from "./globalAuthStore";

const PUBLIC_ENDPOINTS = ["/intake/client", "/intake/internal"];

const isPublicEndpoint = (url: string): boolean => {
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const url = request.url;

    if (isPublicEndpoint(url)) {
      return request;
    }

    try {
      const token = await globalAuthStore.getCachedToken();

      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      } else {
        console.warn("No token available in middleware");
      }
    } catch (error) {
      console.error("Error setting token in middleware:", error);
    }

    return request;
  },

  async onResponse({ request, response }) {
    if (response.status === 401) {
      if (!request.headers.get('X-Token-Refreshed')) {
        console.debug('Received 401 for:', request.url);

        const newRequest = request.clone();
        newRequest.headers.set('X-Token-Refreshed', 'true');
        const token = await globalAuthStore.getTokenFromAuth0Cache();

        if (token) {
          newRequest.headers.set('Authorization', `Bearer ${token}`);
          console.debug('Retrying request with refreshed token');
        } else {
          console.warn('Token refresh failed for retry.');
        }

        return fetch(newRequest);
      }
    }
    return response;
  },
};
