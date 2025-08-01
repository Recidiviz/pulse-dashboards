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

"use client";

import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "@/app/recidiviz-schema";

import { BACKEND_URL } from "./constants";

const fetchClient = createFetchClient<paths>({
	baseUrl: BACKEND_URL,
});
export const $api = createClient(fetchClient);

// todo: creating a hook for using the api client will be useful to avoid sending the token every time, but it needs to be revisited since the header is not being sent
// export const useApiClient = () => {
// 	const { getAccessToken, refreshToken, state } = useAuth();
//
// 	return useMemo(() => {
// 		const fetchClient = createFetchClient<paths>({
// 			baseUrl: BACKEND_URL,
// 			headers: () => {
// 				const token = getAccessToken();
// 				return token ? { Authorization: `Bearer ${token}` } : {};
// 			},
// 		});
//
// 		return createClient(fetchClient);
// 	}, [getAccessToken, refreshToken, state.isAuthorized]);
// };
