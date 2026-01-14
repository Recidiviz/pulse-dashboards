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

import type { AppRouter } from "~@meetings/trpc-types";

export type RawClient = Awaited<
  ReturnType<AppRouter["v1"]["staff"]["getClient"]>
>;

export type Client = Awaited<
  ReturnType<AppRouter["v1"]["staff"]["getClients"]>
>[0] & {
  primaryMetadata: string;
  lastMeeting: string;
  fullName: string;
};

export type RawResident = Awaited<
  ReturnType<AppRouter["v1"]["resident"]["get"]>
>;

export type Resident = Awaited<
  ReturnType<AppRouter["v1"]["resident"]["get"]>
> & {
  primaryMetadata: string;
  lastMeeting: string;
  fullName: string;
};

export type MeetingDetails = Awaited<
  ReturnType<AppRouter["v1"]["meeting"]["getDetails"]>
>;

export type ClientMeetings = Awaited<
  ReturnType<AppRouter["v1"]["client"]["getMeetings"]>
>;

export type ResidentMeetings = Awaited<
  ReturnType<AppRouter["v1"]["resident"]["getMeetings"]>
>;

export type Person = Client | Resident;

export type RecordingStatus =
  | "idle"
  | "recording"
  | "paused"
  | "uploading"
  | "stopping"
  | "discarding"
  | "ending";
