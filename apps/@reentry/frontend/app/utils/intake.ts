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

export const generateToken = (mode: "beta" | "live", clientId: string) => {
	const data = `mode=${mode}|client_id=${clientId}`;
	return Buffer.from(data).toString("base64");
};

export const decodeToken = (token: string) => {
	try {
		const decoded = Buffer.from(token, "base64").toString("utf-8");

		const parts = decoded.split("|");
		const mode = parts.find((part) => part.startsWith("mode="))?.split("=")[1];
		const clientId = parts
			.find((part) => part.startsWith("client_id="))
			?.split("=")[1];

		return { mode, client_id: clientId };
	} catch (error) {
		console.error("Error decoding token:", error);
		return null; // Return null if decoding fails
	}
};
