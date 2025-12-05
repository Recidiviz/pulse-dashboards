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

import { components } from "~@reentry/openapi-types";



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

export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} ${remainingSeconds === 1 ? "sec" : "secs"}`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
  }

  return `${minutes} ${minutes === 1 ? "min" : "mins"} ${remainingSeconds} ${remainingSeconds === 1 ? "sec" : "secs"}`;
};

export const formatAddress = (
    address: components["schemas"]["AddressSubmission"] | null | undefined,
): string | null => {
    if (!address) return null;
    const parts: string[] = [];
    if (address.street_address?.trim()) parts.push(address.street_address.trim());
    if (address.city?.trim()) parts.push(address.city.trim());
    if (address.state?.trim()) parts.push(address.state.trim());
    return parts.length > 0 ? parts.join(", ") : null;
};

export const formatDateReadable = (dateInput: string | Date) => {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

export const formatDateReadableDate = (dateInput: string | Date) => {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};