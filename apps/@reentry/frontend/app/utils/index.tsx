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

export const generateKey = (pre: string) => {
	return `${pre}_${new Date().getTime()}`;
};

export const formatDateMMDDYYYY = (dateInput) => {
	if (!dateInput) return "";

	const date = new Date(dateInput);
	if (Number.isNaN(date.getTime())) return "";

	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
	const day = date.getUTCDate();

	// Format as MM/DD/YYYY
	return `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}`;
};
