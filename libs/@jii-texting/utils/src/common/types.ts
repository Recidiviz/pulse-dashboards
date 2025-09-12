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

import { Prisma } from "~@jii-texting/prisma/client";

export const MESSAGE_ATTEMPT_SELECT = {
  select: {
    id: true,
    twilioMessageSid: true,
    status: true,
    createdTimestamp: true,
  } satisfies Prisma.MessageAttemptSelectScalar,
};

export type MessageAttemptSelect = Prisma.MessageAttemptGetPayload<
  typeof MESSAGE_ATTEMPT_SELECT
>;

export const MESSAGE_SERIES_INCLUDE_ATTEMPTS_AND_GROUP = {
  include: {
    messageAttempts: {
      ...MESSAGE_ATTEMPT_SELECT,
      orderBy: {
        createdTimestamp: "desc",
      },
    },
    group: {
      select: {
        id: true,
        topicId: true,
        messageCopyTemplate: true,
        status: true,
        groupName: true,
      },
    },
  } satisfies Prisma.MessageSeriesInclude & Prisma.MessageSeriesDefaultArgs,
};

export type MessageSeriesWithAttemptsAndGroup = Prisma.MessageSeriesGetPayload<
  typeof MESSAGE_SERIES_INCLUDE_ATTEMPTS_AND_GROUP
>;

export const PERSON_INCLUDE_MESSAGE_SERIES_AND_GROUP = {
  include: {
    groups: { include: { topic: true } },
    messageSeries: {
      ...MESSAGE_SERIES_INCLUDE_ATTEMPTS_AND_GROUP,
    },
  } satisfies Prisma.PersonInclude & Prisma.PersonDefaultArgs,
};

export const PERSON_SELECT_DATA_FOR_MESSAGE = {
  select: {
    givenName: true,
    poName: true,
    phoneNumber: true,
    district: true,
    stableExternalId: true,
    pseudonymizedId: true,
  } satisfies Prisma.PersonSelectScalar & Prisma.PersonDefaultArgs,
};

export type PersonDataForMessage = Prisma.PersonGetPayload<{
  select: {
    givenName: true;
    poName: true;
    phoneNumber: true;
    district: true;
    stableExternalId: true;
    pseudonymizedId: true;
  };
}>;

export type PersonWithMessageSeriesAndGroup = Prisma.PersonGetPayload<
  typeof PERSON_INCLUDE_MESSAGE_SERIES_AND_GROUP
>;

// Actions we might execute for a given person and group
export enum ScriptAction {
  INITIAL_MESSAGE_SENT = "INITIAL_MESSAGE_SENT",
  ELIGIBILITY_MESSAGE_SENT = "ELIGIBILITY_MESSAGE_SENT",
  ERROR = "ERROR",
  SKIPPED = "SKIPPED",
  NOOP = "NOOP",
}

export type GroupAction = {
  id: string;
  action: ScriptAction;
};
