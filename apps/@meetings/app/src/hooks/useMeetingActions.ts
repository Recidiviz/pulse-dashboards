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

import type { inferRouterInputs } from "@trpc/server";

import type { AppRouter } from "~@meetings/trpc-types";

import { PersonType } from "../common/types";
import { trpc } from "../trpc/client";

type RouterInputs = inferRouterInputs<AppRouter>;

export type CreateMeetingParams = {
  personId: bigint;
  personType: PersonType;
  meetingId: string;
  startTime: Date;
};

export type EndMeetingParams = RouterInputs["v1"]["meeting"]["endMeeting"] & {
  personId: bigint;
  personType: PersonType;
};

export type DiscardMeetingParams =
  RouterInputs["v1"]["meeting"]["discardMeeting"] & {
    personId: bigint;
    personType: PersonType;
  };

export type UpdateNotesParams = RouterInputs["v1"]["meeting"]["updateNotes"];

/**
 * Returns async functions that fire the real API calls and invalidate the
 * relevant cache entries. This is the single source of truth for what
 * endpoint to call and what to invalidate for each meeting operation.
 */
export function useMeetingActions() {
  const utils = trpc.useUtils();

  const createMeeting = async ({
    personId,
    personType,
    meetingId,
    startTime,
  }: CreateMeetingParams) => {
    if (personType === "client") {
      await utils.client.v1.client.createMeeting.mutate({
        clientId: personId,
        startTime,
        meetingId,
      });
    } else {
      await utils.client.v1.resident.createMeeting.mutate({
        residentId: personId,
        startTime,
        meetingId,
      });
    }

    utils.v1.client.getMeetings.invalidate({ clientId: personId });
    utils.v1.resident.getMeetings.invalidate({ residentId: personId });
    utils.v1.client.list.invalidate();
    utils.v1.resident.list.invalidate();
  };

  const endMeeting = async ({
    personId,
    personType: _personType,
    ...vars
  }: EndMeetingParams) => {
    await utils.client.v1.meeting.endMeeting.mutate(vars);

    utils.v1.client.getMeetings.invalidate({ clientId: personId });
    utils.v1.resident.getMeetings.invalidate({ residentId: personId });
    utils.v1.client.list.invalidate();
    utils.v1.resident.list.invalidate();
  };

  const discardMeeting = async ({
    personId,
    personType: _personType,
    ...vars
  }: DiscardMeetingParams) => {
    await utils.client.v1.meeting.discardMeeting.mutate(vars);

    utils.v1.client.getMeetings.invalidate({ clientId: personId });
    utils.v1.resident.getMeetings.invalidate({ residentId: personId });
    utils.v1.client.list.invalidate();
    utils.v1.resident.list.invalidate();
  };

  const updateNotes = async (vars: UpdateNotesParams) => {
    await utils.client.v1.meeting.updateNotes.mutate(vars);

    utils.v1.meeting.getDetails.invalidate({ meetingId: vars.meetingId });
  };

  return { createMeeting, endMeeting, discardMeeting, updateNotes };
}
