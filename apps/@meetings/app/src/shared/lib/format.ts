// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { formatDistanceToNow, isYesterday } from "date-fns";
import startCase from "lodash/startCase";

export const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (!parts[0]) return "";
  return (parts[0][0] + (parts.pop() || "")[0]).toUpperCase();
};

// duration: hh:mm:ss
export const formatDurationCompact = (duration: string) => {
  const [hours, minutes, seconds] = duration.split(":").map(Number);

  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

export const formatDurationNumeric = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  return `0:${seconds.toString().padStart(2, "0")}`;
};

export const humanReadableTitleCase = (str: string): string =>
  startCase(str.toLowerCase());

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (secondsAgo < 60) {
    return "Just now";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return formatDistanceToNow(date, { addSuffix: true });
};
